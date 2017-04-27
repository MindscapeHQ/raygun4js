/* globals describe, it, expect, browser, window */
var _ = require('underscore');
var common = require('../common');

var _eventsEndpoint = 'https://api.raygun.io/events';

describe("XHR functional tests for /events with V1", function() {

  // Tests

  it("performs an XHR to /events when Raygun.trackEvent() is called", function () {
    browser.url('http://localhost:4567/fixtures/v1/trackEvent.html');

    browser.pause(6000);

    var inFlightXhrs = browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = _.any(inFlightXhrs.value, function (req) {
      return req.url.indexOf(_eventsEndpoint) === 0;
    });

    if (!common.isIEVersion('8')) {
      expect(didPerformRequest).toBe(true);
    }
  });
});
