/* globals describe, beforeEach, it, expect, browser, window */

var _ = require('underscore');

describe("ClientIp", function() {

  it("X-Remote-Address is null when not set", function () {
    await browser.url('http://localhost:4567/fixtures/v2/withoutClientIpSet.html');

    await browser.pause(4000);

    var sentXhrs = await browser.execute(function () {
      return window.__sentXHRs;
    });

    var remoteAddressIsUndefined = _.every(sentXhrs, function (req) {
      return req.clientIp === null;
    });

    await expect(remoteAddressIsUndefined).toBe(true);
  });

  it("X-Remote-Address is equal to '192.168.0.12'", function () {
    await browser.url('http://localhost:4567/fixtures/v2/withClientIpSet.html');

    await browser.pause(4000);

    var sentXhrs = await browser.execute(function () {
      return window.__sentXHRs;
    });

    var remoteAddressIsSet = _.every(sentXhrs, function (req) {
      return req.clientIp === "192.168.0.12";
    });

    await expect(remoteAddressIsSet).toBe(true);
  });
});
