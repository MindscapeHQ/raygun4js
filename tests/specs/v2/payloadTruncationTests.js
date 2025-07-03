var _ = require('underscore');
var common = require('../common');

var _entriesEndpoint = 'https://api.raygun.io/entries';

describe("Payload truncation tests for v2 manual send", function() {

  it("truncates error messages longer than 512 characters", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/manualSendLongMessage.html');

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = await _.any(requestPayloads, function (payload) {
      return payload.Details.Error.Message.length === 512;
    });

    await expect(passes).toBe(true);
  });

  it("does not truncate error messages shorter than 512 characters", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/manualSendShortMessage.html');

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var originalMessage = "This is a short message that should not be truncated";
    var passes = await _.any(requestPayloads, function (payload) {
      return payload.Details.Error.Message === originalMessage;
    });

    await expect(passes).toBe(true);
  });

  it("truncates error messages at exactly 512 characters", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/manualSendExactly512Message.html');

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = await _.any(requestPayloads, function (payload) {
      return payload.Details.Error.Message.length === 512;
    });

    await expect(passes).toBe(true);
  });

  it("truncates error messages longer than 512 characters when sent as Error object", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/manualSendLongMessageAsError.html');

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = await _.any(requestPayloads, function (payload) {
      return payload.Details.Error.Message.length === 512;
    });

    await expect(passes).toBe(true);
  });

});
