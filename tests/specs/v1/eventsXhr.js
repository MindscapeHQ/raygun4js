/* globals describe, it, expect, browser, window */
var _ = require('underscore');
var common = require('../common');

var _eventsEndpoint = 'https://api.raygun.io/events';

describe("XHR functional tests for /events with V1", function() {

  // Tests

  it("performs an XHR to /events when Raygun.trackEvent() is called", function () {
    await browser.url('http://localhost:4567/fixtures/v1/trackEvent.html');

    await browser.pause(6000);

    var inFlightXhrs = await browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = await _.any(inFlightXhrs, function (req) {
      return req.url.indexOf(_eventsEndpoint) === 0;
    });

    if (!(await common.isIEVersion('8'))) {
      await expect(didPerformRequest).toBe(true);
    }
  });
});
