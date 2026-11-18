# Contributing

## Important notes
Please don't edit files in the `dist` subdirectory as they are generated via Grunt. You'll find source code in the `src` subdirectory!

### Code style
Regarding code style like indentation and whitespace, **follow the conventions you see used in the source already.**

## Modifying the code
First, ensure that you have the latest [Node.js](http://nodejs.org/) and [npm](http://npmjs.org/) installed.

Test that Grunt's CLI is installed by running `grunt --version`.  If the command isn't found, run `npm install -g grunt-cli`.  For more information about installing Grunt, see the [getting started guide](http://gruntjs.com/getting-started).

1. Fork and clone the repo.
1. Run `npm install` to install all dependencies (including Grunt).
1. Run `grunt` to build this project, then `npm test` to run the tests.

Assuming that you don't see any red, you're ready to go. Run both commands after making changes.

## Tests

The unit and E2E tests can be run with `npm test`. If you add or modify a feature, please add a new test to `tests/specs`, and a new fixture if required (or reuse an existing one if there's one that fufills your needs).

## Preparing release assets locally

The existing `npx grunt build` command creates `dist/`: Browserify assembles the standard and
vanilla bundles, concatenation adds the UMD wrapper, version replacement updates the bundles
and package metadata, and Uglify generates minified bundles, source maps, and loader snippets.
It does not run the tests or create npm and NuGet packages. The `compile` task also skips version
replacement and snippet generation; use `build` for release preparation.

To prepare all distribution assets from one build, install Node.js 20 or later, a .NET SDK 8
or later (for NuGet packaging), and Git, then run:

```sh
npm ci
npm run release:prepare
```

The command builds once, runs the existing unit, TypeScript, and browser tests, and creates:

```text
release/<version>/
├── cdn/raygun4js/<version>/
│   ├── raygun*.js and source maps
│   ├── integrity.json
│   └── snippet/
│       ├── unminified*.js
│       ├── minified*.js
│       └── snippet*.html
├── packages/
│   ├── raygun4js-<version>.tgz
│   └── raygun4js.<version>.nupkg
└── release.json
```

For local artifact inspection, `npm run release:assets` packages an existing `dist/` build
and runs only the release-asset checks. Run `npx grunt build` first. This separate step does
not certify that the full provider test suite passed; a production release should require
a successful `npm run release:prepare`.

The CDN snippets use the exact version from `package.json`, HTTPS, SHA-384 integrity, and
anonymous CORS. Standard, no-handler, and fetch-handler variants are generated from the
existing snippet sources. The normal `dist/snippet/` files still use the floating URL.
The HTML snippets load the provider; add the usual API key and product configuration afterward.
`integrity.json` records URLs and hashes for the bundles and source maps. `release.json`
records the source commit, whether the working tree has uncommitted changes, tool versions,
and package checksums. No wall-clock date is included in the bundle banner.

Before accepting the output, the command verifies the manifest and uses a browser to check
that every pinned snippet format loads, preserves queued configuration and early errors, and
rejects an incorrect hash or missing CORS headers. Generation fails if a source snippet cannot
be pinned and given integrity attributes. Run `npm run test:release` to repeat the asset checks
against an existing local release. Browser tests use WebdriverIO's automatic Chrome/driver
setup; `CHROME_BIN` and `CHROMEDRIVER_PATH` can select installed binaries. The first run may
download browser binaries and the .NET packaging project's dependencies.

Run `npm run test:release-preparation` after building to test replacement, rollback, and rejection
of unsupported snippet sources. These checks run the packaging command in isolated temporary
copies and leave your existing release assets untouched.

The output directory is replaced only after the release-asset checks pass. Previous output is
kept as a backup until installation succeeds and restored if installation fails. If backup cleanup
fails, the new output stays installed and the command prints the backup path for manual cleanup.
Release output and backups are ignored by Git.
These commands only prepare local files: they do not upload, publish packages, update CDN latest,
or configure TeamCity. A later TeamCity publishing job must consume the retained artifacts
without rebuilding. Use a new version before publishing changed files; never replace an
existing published version. In particular, locally rebuilt 3.1.4 assets are not replacements
for the existing CDN 3.1.4 files or their SRI hashes.

## Submitting pull requests

1. Create a new branch, please don't work in your `master` branch directly.
1. Update the documentation to reflect any changes.
1. Push to your fork and submit a pull request.
