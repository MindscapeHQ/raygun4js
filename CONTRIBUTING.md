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
1. Run `grunt` to build, compile and test this project.

Assuming that you don't see any red, you're ready to go. Just be sure to run `grunt` after making any changes, to ensure that nothing is broken.

## Tests

The unit and E2E tests can be run with `grunt test`. If you add or modify a feature, please add a new test to `tests/specs`, and a new fixture if required (or reuse an existing one if there's one that fufills your needs).

## Submitting pull requests

1. Create a new branch, please don't work in your `master` branch directly.
1. Update the documentation to reflect any changes.
1. Push to your fork and submit a pull request.
