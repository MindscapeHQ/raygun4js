var webdriverio = require('webdriverio');
var _ = require('underscore');

var _entriesEndpoint = 'https://api.raygun.io/entries';

describe("Functional tests for rg4js() calls to ensure they are executed by the loader", function() {

  it("sets onBeforeSend when it is called before library is loaded", function () {
    browser.url('http://localhost:4567/fixtures/v2/rg4jsBeforeLibraryLoaded.html');

    browser.pause(5000);

    var didPerformOnBeforeSend = browser.execute(function () {
      return window.didPerformOnBeforeSend;
    });

    expect(didPerformOnBeforeSend.value).toEqual(['beforesendcalled', 'the_scope', 'object']);
  });

  it("sets onBeforeSend when it is called after library is loaded", function () {
    browser.url('http://localhost:4567/fixtures/v2/rg4jsAfterLibraryLoaded.html');

    browser.pause(5000);

    var didPerformOnBeforeSend = browser.execute(function () {
      return window.didPerformOnBeforeSend;
    });

    expect(didPerformOnBeforeSend.value).toEqual(['beforesendcalled', 'the_scope', 'object']);
  });

});