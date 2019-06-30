/* globals describe, beforeEach, it, expect, browser, window */

var _ = require('underscore');

describe("ClientIp", function() {

  it("X-Remote-Address is null when not set", function () {
    browser.url('http://localhost:4567/fixtures/v2/withoutClientIpSet.html');

    browser.pause(4000);

    var sentXhrs = browser.execute(function () {
      return window.__sentXHRs;
    });

    var remoteAddressIsUndefined = _.every(sentXhrs.value, function (req) {
      return req.clientIp === null;
    });

    expect(remoteAddressIsUndefined).toBe(true);
  });

  it("X-Remote-Address is equal to '192.168.0.12'", function () {
    browser.url('http://localhost:4567/fixtures/v2/withClientIpSet.html');

    browser.pause(4000);

    var sentXhrs = browser.execute(function () {
      return window.__sentXHRs;
    });

    var remoteAddressIsSet = _.every(sentXhrs.value, function (req) {
      return req.clientIp === "192.168.0.12";
    });

    expect(remoteAddressIsSet).toBe(true);
  });
});
