var webdriverio = require('webdriverio');
var _ = require('underscore');

var _eventsEndpoint = 'https://api.raygun.com/events';

describe('onBeforeSendRUM callback', function() {
  it('lets you modify the payload before sending', async function() {
    await browser.url('http://localhost:4567/fixtures/v2/onBeforeSendRUM.html');

    await browser.pause(4000);

    var modifiedPayload = await browser.execute(function () {
      return window.__requestPayloads[0];
    });

    expect(modifiedPayload.eventData[0].version).toBe('1.0.0');
  });

  it('serializes the eventData.data to a string', async function() {
    await browser.url('http://localhost:4567/fixtures/v2/onBeforeSendRUM.html');

    await browser.pause(4000);

    var firstPayload = await browser.execute(function () {
      return window.__requestPayloads[0];
    });

    var typeOfData = typeof firstPayload.eventData[0].data;
    expect(typeOfData === "string").toBe(true);
  });

  it('allows you to cancel sending a payload', async function() {
    await browser.url('http://localhost:4567/fixtures/v2/onBeforeSendRUM.html');

    await browser.pause(4000);

    var allPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    expect(allPayloads.length).toBe(1);
  });
});
