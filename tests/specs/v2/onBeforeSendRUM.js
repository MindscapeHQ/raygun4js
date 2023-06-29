var webdriverio = require('webdriverio');
var _ = require('underscore');

var _eventsEndpoint = 'https://api.raygun.io/events';

describe('onBeforeSendRUM callback', function() {
  it('lets you modify the payload before sending', function() {
    await browser.url('http://localhost:4567/fixtures/v2/onBeforeSendRUM.html');

    await browser.pause(4000);

    var modifiedPayload = await browser.execute(function () {
      return window.__requestPayloads[0];
    });

    await expect(modifiedPayload.eventData[0].version).toBe('1.0.0');
  });

  it('serializes the eventData.data to a string', function() {
    await browser.url('http://localhost:4567/fixtures/v2/onBeforeSendRUM.html');

    await browser.pause(4000);

    var firstPayload = await browser.execute(function () {
      return window.__requestPayloads[0];
    });

    var typeOfData = typeof firstPayload.eventData[0].data;
    await expect(typeOfData === "string").toBe(true);
  });

  it('allows you to cancel sending a payload', function() {
    await browser.url('http://localhost:4567/fixtures/v2/onBeforeSendRUM.html');

    await browser.pause(4000);

    var allPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    await expect(allPayloads.length).toBe(1);
  });
});
