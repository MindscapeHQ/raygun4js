/* globals describe, beforeEach, it, expect, browser, window */

var _ = require('underscore');
var common = require('../common');

var _entriesEndpoint = 'https://api.raygun.io/entries';

describe("OnBeforeSend callback", function () {
    it("onBeforeSend can access Breadcrumb payload", async function () {
        await browser.url('http://localhost:4567/fixtures/v2/onBeforeSendBreadcrumbs.html');

        await browser.pause(4000);

        var inFlightXhrs = await browser.execute(function () {
            return window.__inFlightXHRs;
        });

        var didPerformRequest = await _.any(inFlightXhrs, function (req) {
            return req.url.indexOf(_entriesEndpoint) === 0;
        });

        await expect(didPerformRequest).toBe(true);
    });
});
