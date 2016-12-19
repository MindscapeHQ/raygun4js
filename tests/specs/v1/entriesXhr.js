var webdriverio = require('webdriverio');
var _ = require('underscore');

var _entriesEndpoint = 'https://api.raygun.io/entries';

describe("XHR functional tests for /entries with V1", function() {

  // Tests

  it('performs an XHR to /entries when Raygun.send() is called', function () {
    browser.url('http://localhost:4567/fixtures/v1/manualSend.html');

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