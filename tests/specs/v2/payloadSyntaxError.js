var webdriverio = require('webdriverio');
var _ = require('underscore');

var _entriesEndpoint = 'https://api.raygun.io/entries';

describe("Payload functional validation tests for V2 syntax error with Snippet v2.0", function() {

  it("performs an XHR to /entries when a syntax error is present", function () {
    browser.url('http://localhost:4567/fixtures/v2/syntaxErrorSnippetV2.html');

    browser.pause(4000);

    var inFlightXhrs = browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = _.any(inFlightXhrs.value, function (req) {
      return req.url.indexOf(_entriesEndpoint) === 0;
    });

    expect(didPerformRequest).toBe(true);
  });

});

