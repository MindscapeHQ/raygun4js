var webdriverio = require('webdriverio');
var _ = require('underscore');

var _entriesEndpoint = 'https://api.raygun.io/entries';

describe("Functional tests for V2 config statements called before library has loaded", function() {

  it("performs an XHR to /entries when rg4js('send') is called", function () {
    browser.url('http://localhost:4567/fixtures/v2/rg4jsBeforeLibraryLoaded.html');

    browser.pause(5000);

    var didPerformOnBeforeSend = browser.execute(function () {
      return window.didPerformOnBeforeSend;
    });

    expect(didPerformOnBeforeSend.value).toEqual(['beforesendcalled', 'the_scope', 'object']);
  });

});