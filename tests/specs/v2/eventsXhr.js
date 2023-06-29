var webdriverio = require('webdriverio');
var _ = require('underscore');

var _eventsEndpoint = 'https://api.raygun.io/events';

describe("XHR functional tests for /events with V2", function() {

  // Tests

  it("performs an XHR to /events when rg4js('trackEvent') is called", function () {
    await browser.url('http://localhost:4567/fixtures/v2/trackEvent.html');

    await browser.pause(4000);

    var inFlightXhrs = await browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = await _.any(inFlightXhrs, function (req) {
      return req.url.indexOf(_eventsEndpoint) === 0;
    });

    await expect(didPerformRequest).toBe(true);
  });

});