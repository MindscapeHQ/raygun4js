/* globals describe, beforeEach, it, expect, browser, window */

var _ = require('underscore');
var common = require('../common');

var _entriesEndpoint = 'https://api.raygun.com/entries';

describe("Payload functional validation tests for V2 manual send", function() {

  it("performs an XHR to /entries when rg4js('send') is called", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/manualSend.html');

    await browser.pause(4000);

    var inFlightXhrs = await browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = await _.any(inFlightXhrs, function (req) {
      return req.url.indexOf(_entriesEndpoint) === 0;
    });

    await expect(didPerformRequest).toBe(true);
  });

  it("doesn't performs an XHR to /entries when the API key isn't set", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/manualSendNoApiKey.html');

    await browser.pause(4000);

    var inFlightXhrs = await browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = await _.any(inFlightXhrs, function (req) {
      return req.url.indexOf(_entriesEndpoint) === 0;
    });

    await expect(didPerformRequest).toBe(false);
  });

  it("has the error message in the payload set", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/manualSend.html');

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = await _.any(requestPayloads, function (payload) {
      return payload.Details.Error.Message === 'Manual send' || payload.Details.Error.Message === 'Script error';
    });

    await expect(passes).toBe(true);
  });

  it("works with ignore3rdPartyErrors enabled", async function() {
    await browser.url('http://localhost:4567/fixtures/v2/manualSend3rdParty.html');

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = await _.any(requestPayloads, function (payload) {
      return payload.Details.Error.Message === 'Manual send' || payload.Details.Error.Message === 'Script error';
    });

    await expect(passes).toBe(true);
  });

  it("has the classname in the payload set", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/manualSend.html');

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = await _.any(requestPayloads, function (payload) {
      return payload.Details.Error.ClassName === 'Error';
    });

    if (!(await common.isOldIE())) {
      await expect(passes).toBe(true);
    }
  });

  it("has the filename in the stacktrace payload set", async function () {
    var pageUrl = 'http://localhost:4567/fixtures/v2/manualSend.html';

    await browser.url(pageUrl);

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = await _.any(requestPayloads, function (payload) {
      var stackTrace = payload.Details.Error.StackTrace[0];
      return stackTrace && stackTrace.FileName === pageUrl;
    });

    if (!(await common.isOldIE())) {
      await expect(passes).toBe(true);
    }
  });

  it("has tags in the payload when tags are passed in", async function () {
    var pageUrl = 'http://localhost:4567/fixtures/v2/manualSendTag.html';

    await browser.url(pageUrl);

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = await _.any(requestPayloads, function (payload) {
      return payload.Details.Tags[0] === 'my_tag';
    });

    await expect(passes).toBe(true);
  });

  it("has custom data in the payload when custom data is passed in", async function () {
    var pageUrl = 'http://localhost:4567/fixtures/v2/manualSendCustomData.html';

    await browser.url(pageUrl);

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = await _.any(requestPayloads, function (payload) {
      return payload.Details.UserCustomData.myCustomKey === 'myCustomValue';
    });

    await expect(passes).toBe(true);
  });

  it("has correct user payload when rg4js('setUser') is called", async function () {
    var pageUrl = 'http://localhost:4567/fixtures/v2/manualSendUser.html';

    await browser.url(pageUrl);

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = await _.any(requestPayloads, function (payload) {
      return payload.Details.User.Identifier === 'user_email_address@localhost.local' &&
        payload.Details.User.IsAnonymous === false &&
        payload.Details.User.FirstName === 'Foo' &&
        payload.Details.User.FullName === 'Foo Bar' &&
        payload.Details.User.UUID === 'BAE62917-ACE8-ab3D-9287-B6A33B8E8C55';
    });

    await expect(passes).toBe(true);
  });

  it("has correct version in payload when rg4js('setVersion') is called", async function () {
    var pageUrl = 'http://localhost:4567/fixtures/v2/manualSendVersion.html';

    await browser.url(pageUrl);

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = await _.any(requestPayloads, function (payload) {
      return payload.Details.Version === '1.0.0.0';
    });

    await expect(passes).toBe(true);
  });

  it("supports sending errors with the error as a string", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/manualSendErrorAsString.html');

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.every(requestPayloads, function (payload) {
      return payload.Details.Error.Message === 'Manual send';
    });

    await expect(requestPayloads.length).toBe(2)
    await expect(passes).toBe(true);
  });

});
