'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const pkg = require('../package.json');

const root = path.resolve(__dirname, '..');

function fixture(t) {
  const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'raygun-release-test-')));
  t.after(() => {
    const releases = path.join(directory, 'release');
    if (fs.existsSync(releases)) {
      for (const name of fs.readdirSync(releases)) {
        const packages = path.join(releases, name, 'packages');
        if (fs.existsSync(packages)) {
          fs.chmodSync(packages, 0o755);
        }
      }
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });
  for (const name of ['scripts', 'src/snippet', 'tests/release.test.js', 'Gruntfile.js',
    'package.json', 'raygun4js.nuspec', 'README.md', 'LICENSE', 'dist', 'types', '.gitignore']) {
    fs.cpSync(path.join(root, name), path.join(directory, name), { recursive: true });
  }
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(directory, 'node_modules'), 'junction');
  for (const args of [['init', '--quiet'], ['-c', 'user.name=Release test',
    '-c', 'user.email=release-test@example.invalid', 'commit', '--quiet', '--allow-empty', '-m', 'Fixture']]) {
    const result = spawnSync('git', args, { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
  return directory;
}

function prepare(directory, env = {}) {
  assert.ok(process.env.npm_execpath, 'Run with npm run test:release-preparation');
  const childEnv = { ...process.env, ...env };
  // The command starts its own test runner rather than joining this one.
  delete childEnv.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, [process.env.npm_execpath, 'run', 'release:assets'], {
    cwd: directory,
    env: childEnv,
    encoding: 'utf8',
    timeout: 120000,
  });
}

test('release preparation safely replaces protected previous output', { timeout: 150000 }, t => {
  const directory = fixture(t);
  const destination = path.join(directory, 'release', pkg.version);
  const previousBundle = path.join(destination, 'cdn', 'previous.js');
  const previousPackage = path.join(destination, 'packages', 'previous.tgz');
  fs.mkdirSync(path.dirname(previousBundle), { recursive: true });
  fs.mkdirSync(path.dirname(previousPackage));
  fs.writeFileSync(previousBundle, 'previous bundle');
  fs.writeFileSync(previousPackage, 'previous package');
  fs.chmodSync(path.dirname(previousPackage), 0o555);

  const result = prepare(directory);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(fs.readFileSync(path.join(destination, 'cdn/raygun4js', pkg.version, 'raygun.min.js')),
    fs.readFileSync(path.join(root, 'dist/raygun.min.js')));
  assert.ok(fs.existsSync(path.join(destination, 'packages', `raygun4js-${pkg.version}.tgz`)));
  assert.ok(fs.existsSync(path.join(destination, 'packages', `raygun4js.${pkg.version}.nupkg`)));
  assert.equal(fs.existsSync(previousBundle), false);
});

test('release preparation restores previous output when installation fails', { timeout: 150000 }, t => {
  const directory = fixture(t);
  const destination = path.join(directory, 'release', pkg.version);
  fs.mkdirSync(destination, { recursive: true });
  fs.writeFileSync(path.join(destination, 'previous.txt'), 'retain this exact release');
  const preload = path.join(directory, 'fail-install.cjs');
  fs.writeFileSync(preload, `
    const fs = require('node:fs');
    const path = require('node:path');
    const rename = fs.renameSync;
    const destination = ${JSON.stringify(destination)};
    fs.renameSync = function(from, to) {
      if (to === destination && path.basename(from).startsWith('.${pkg.version}-') &&
          !from.endsWith('.previous')) {
        throw Object.assign(new Error('Simulated release installation failure'), { code: 'EACCES' });
      }
      return rename.apply(this, arguments);
    };
  `);

  const result = prepare(directory, {
    NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --require ${JSON.stringify(preload)}`,
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Simulated release installation failure/);
  assert.equal(fs.readFileSync(path.join(destination, 'previous.txt'), 'utf8'), 'retain this exact release');
  assert.deepEqual(fs.readdirSync(path.join(directory, 'release')), [pkg.version]);
});

test('release preparation rejects snippets it cannot secure', { timeout: 150000 }, t => {
  const directory = fixture(t);
  const source = path.join(directory, 'src/snippet/unminified.nohandler.js');
  fs.writeFileSync(source, fs.readFileSync(source, 'utf8').replace('s.src = url;', 's.src = String(url);'));

  const result = prepare(directory);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Cannot generate pinned SRI snippet from unminified\.nohandler\.js/);
  assert.deepEqual(fs.readdirSync(path.join(directory, 'release')), []);
});
