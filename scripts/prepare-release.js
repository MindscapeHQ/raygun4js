'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const grunt = require('grunt');
const pkg = require('../package.json');

const root = path.resolve(__dirname, '..');
const npm = process.env.npm_execpath;

function run(command, args, capture = false, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed\n${result.stderr || ''}`);
  }
  return capture ? result.stdout.trim() : undefined;
}

function integrity(file) {
  return 'sha384-' + crypto.createHash('sha384').update(fs.readFileSync(file)).digest('base64');
}

function writeJSON(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

async function prepare() {
  if (!npm) {
    throw new Error('Run this command with npm run release:assets.');
  }

  // Packaging consumes the existing build; release:prepare owns building and testing it.
  const dotnetVersion = run('dotnet', ['--version'], true);
  const npmVersion = run(process.execPath, [npm, '--version'], true);
  const commit = run('git', ['rev-parse', 'HEAD'], true);

  const releases = path.join(root, 'release');
  fs.mkdirSync(releases, { recursive: true });
  const staging = fs.mkdtempSync(path.join(releases, `.${pkg.version}-`));

  try {
    const cdn = path.join(staging, 'cdn', 'raygun4js', pkg.version);
    const snippets = path.join(cdn, 'snippet');
    const packages = path.join(staging, 'packages');
    const work = path.join(staging, '.work');
    fs.mkdirSync(snippets, { recursive: true });
    fs.mkdirSync(packages);
    fs.mkdirSync(work);

    const manifest = { version: pkg.version, files: {} };
    for (const entry of fs.readdirSync(path.join(root, 'dist'), { withFileTypes: true })) {
      if (!entry.isFile()) {
        continue;
      }
      const file = path.join(cdn, entry.name);
      fs.copyFileSync(path.join(root, 'dist', entry.name), file);
      manifest.files[entry.name] = {
        url: `https://cdn.raygun.io/raygun4js/${pkg.version}/${entry.name}`,
        integrity: integrity(file),
      };
    }
    writeJSON(path.join(cdn, 'integrity.json'), manifest);

    const bundle = manifest.files['raygun.min.js'];
    const snippetFiles = {};
    for (const variant of ['', '.nohandler', '.fetchhandler']) {
      const sourceName = `unminified${variant}.js`;
      const source = fs.readFileSync(path.join(root, 'src', 'snippet', sourceName), 'utf8')
        .replace('//cdn.raygun.io/raygun4js/raygun.min.js', bundle.url)
        .replace(/(\w+)\.src = url;/, (match, script) =>
          `${match}\n    ${script}.integrity = '${bundle.integrity}';\n` +
          `    ${script}.crossOrigin = 'anonymous';`);
      const input = path.join(snippets, sourceName);
      const output = path.join(snippets, `minified${variant}.js`);
      fs.writeFileSync(input, source);
      snippetFiles[output] = [input];
    }

    // Reuse the existing snippet minifier configuration, without rebuilding bundles.
    require('../Gruntfile')(grunt);
    grunt.config.set('uglify.snippet.files', snippetFiles);
    await new Promise(resolve => grunt.tasks(['uglify:snippet'], { gruntfile: false }, resolve));
    for (const variant of ['', '.nohandler', '.fetchhandler']) {
      const source = fs.readFileSync(path.join(snippets, `minified${variant}.js`), 'utf8');
      fs.writeFileSync(path.join(snippets, `snippet${variant}.html`),
        `<script type="text/javascript">\n${source}\n</script>\n`);
    }

    // npm lifecycle hooks cannot rebuild or publish while packaging.
    run(process.execPath, [npm, 'pack', '--ignore-scripts', '--offline', '--pack-destination', packages]);

    // The SDK is only a cross-platform NuGet packer; the nuspec owns package contents.
    const project = path.join(work, 'nuget.csproj');
    fs.copyFileSync(path.join(__dirname, 'nuget.csproj'), project);
    run('dotnet', ['restore', project]);
    run('dotnet', ['pack', project, '--no-build', '--output', packages,
      `-p:NuspecFile=${path.join(root, 'raygun4js.nuspec')}`, `-p:NuspecBasePath=${root}`]);
    fs.rmSync(work, { recursive: true });

    writeJSON(path.join(staging, 'release.json'), {
      version: pkg.version,
      commit,
      dirty: run('git', ['status', '--porcelain'], true) !== '',
      tools: { node: process.version, npm: npmVersion, dotnet: dotnetVersion },
      packages: fs.readdirSync(packages).map(file => ({
        file: `packages/${file}`,
        integrity: integrity(path.join(packages, file)),
      })),
    });

    run(process.execPath, [npm, 'run', 'test:release'], false, {
      ...process.env,
      RAYGUN_RELEASE_DIR: staging,
    });

    const destination = path.join(releases, pkg.version);
    fs.rmSync(destination, { recursive: true, force: true });
    fs.renameSync(staging, destination);
    console.log(`\nLocal release assets prepared in ${destination}`);
    console.log('Nothing was published. Never overwrite an existing published version with these files.');
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

prepare().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
