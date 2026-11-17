'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');
const { remote } = require('webdriverio');
const pkg = require('../package.json');

const root = path.resolve(__dirname, '..');
const release = process.env.RAYGUN_RELEASE_DIR || path.join(root, 'release', pkg.version);
const cdn = path.join(release, 'cdn', 'raygun4js', pkg.version);
const manifest = JSON.parse(fs.readFileSync(path.join(cdn, 'integrity.json'), 'utf8'));

test('release manifest describes the built bundles and packaged artifacts', () => {
  const files = ['raygun.js', 'raygun.vanilla.js', 'raygun.umd.js',
    'raygun.min.js', 'raygun.vanilla.min.js', 'raygun.umd.min.js',
    'raygun.min.js.map', 'raygun.vanilla.min.js.map', 'raygun.umd.min.js.map'];
  assert.equal(manifest.version, pkg.version);
  assert.deepEqual(Object.keys(manifest.files).sort(), files.sort());
  for (const file of files) {
    const bytes = fs.readFileSync(path.join(cdn, file));
    assert.deepEqual(bytes, fs.readFileSync(path.join(root, 'dist', file)));
    assert.equal(manifest.files[file].url, `https://cdn.raygun.io/raygun4js/${pkg.version}/${file}`);
    assert.equal(manifest.files[file].integrity,
      'sha384-' + crypto.createHash('sha384').update(bytes).digest('base64'));
    if (file.endsWith('.js')) {
      assert.ok(!bytes.includes('{{VERSION}}'), `${file} still contains a version placeholder`);
    }
  }

  const metadata = JSON.parse(fs.readFileSync(path.join(release, 'release.json'), 'utf8'));
  assert.equal(metadata.version, pkg.version);
  assert.match(metadata.commit, /^[a-f0-9]{40}$/);
  assert.equal(typeof metadata.dirty, 'boolean');
  assert.deepEqual(metadata.packages.map(item => item.file).sort(), [
    `packages/raygun4js-${pkg.version}.tgz`, `packages/raygun4js.${pkg.version}.nupkg`,
  ].sort());
  for (const item of metadata.packages) {
    assert.equal(item.integrity, 'sha384-' + crypto.createHash('sha384')
      .update(fs.readFileSync(path.join(release, item.file))).digest('base64'));
  }
});

test('pinned async snippets load with SRI and reject a wrong hash or missing CORS',
  { timeout: 180000 }, async t => {
    let page = '';
    let allowCors = true;
    const bundle = fs.readFileSync(path.join(cdn, 'raygun.min.js'));
    const server = http.createServer((request, response) => {
      response.setHeader('Cache-Control', 'no-store');
      if (request.url === '/') {
        response.setHeader('Content-Type', 'text/html');
        response.end(page);
      } else if (request.url === `/raygun4js/${pkg.version}/raygun.min.js`) {
        response.setHeader('Content-Type', 'text/javascript');
        if (allowCors) {
          response.setHeader('Access-Control-Allow-Origin', '*');
        }
        response.end(bundle);
      } else {
        response.writeHead(404).end();
      }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    let browser;

    try {
      browser = await remote({
        logLevel: 'error',
        capabilities: {
          browserName: 'chrome',
          'goog:chromeOptions': {
            args: ['headless', 'disable-gpu', 'no-sandbox'],
            ...(process.env.CHROME_BIN ? { binary: process.env.CHROME_BIN } : {}),
          },
        },
      });

      async function load(file, { badHash = false, cors = true } = {}) {
        let snippet = fs.readFileSync(path.join(cdn, 'snippet', file), 'utf8');
        assert.ok(snippet.includes(manifest.files['raygun.min.js'].url), `${file} is not pinned`);
        snippet = snippet.replaceAll('https://cdn.raygun.io', `http://localhost:${port}`);
        if (badHash) {
          snippet = snippet.replace(manifest.files['raygun.min.js'].integrity,
            'sha384-' + Buffer.alloc(48).toString('base64'));
        }
        allowCors = cors;
        if (!file.endsWith('.html')) {
          snippet = `<script>${snippet}</script>`;
        }
        page = `<!doctype html><html><head><script>
          window.releaseOriginalFetch = window.fetch;
          window.addEventListener('error', function(event) {
            if (event.target.tagName === 'SCRIPT') window.releaseBlocked = true;
          }, true);
          </script>${snippet}<script>
          rg4js('getRaygunInstance', function(raygun) { window.releaseLoaded = !!raygun; });
          if (window.onerror) window.onerror('early release error', '', 1, 1, new Error('early release error'));
          </script></head><body></body></html>`;
        await browser.url(`http://127.0.0.1:${port}/`);
        await browser.waitUntil(() => browser.execute(() =>
          !!(window.releaseLoaded || window.releaseBlocked)), { timeout: 10000 });
        return browser.execute(() => ({
          loaded: !!window.releaseLoaded,
          blocked: !!window.releaseBlocked,
          initialized: !!window.RaygunInitialized,
          queuedError: window.rg4js.q && window.rg4js.q[0] && window.rg4js.q[0].e.message,
          fetchPreserved: window.__raygunOriginalFetch === window.releaseOriginalFetch,
        }));
      }

      for (const variant of ['', '.nohandler', '.fetchhandler']) {
        for (const file of [`unminified${variant}.js`, `minified${variant}.js`, `snippet${variant}.html`]) {
          await t.test(`${file} loads and executes queued configuration`, async () => {
            const result = await load(file);
            assert.equal(result.loaded, true);
            assert.equal(result.initialized, true);
            assert.equal(result.blocked, false);
            if (variant !== '.nohandler') {
              assert.equal(result.queuedError, 'early release error');
            }
            if (variant === '.fetchhandler') {
              assert.equal(result.fetchPreserved, true);
            }
          });
        }
      }
      for (const options of [{ badHash: true }, { cors: false }]) {
        await t.test(`blocks the provider with ${options.badHash ? 'an incorrect hash' : 'missing CORS'}`,
          async () => {
            const result = await load('snippet.html', options);
            assert.equal(result.blocked, true);
            assert.equal(result.loaded, false);
            assert.equal(result.initialized, false);
          });
      }
    } finally {
      if (browser) {
        await browser.deleteSession();
      }
      await new Promise(resolve => server.close(resolve));
    }
  });
