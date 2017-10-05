var webdriverio = require('webdriverio');
var _ = require('underscore');

var _eventsEndpoint = 'https://api.raygun.io/events';

describe('onBeforeSendRUM callback', function() {
  it('lets you modify the payload before sending', function() {
    browser.url('http://localhost:4567/fixtures/v2/onBeforeSendRUM.html');

    browser.pause(4000);

    var modifiedPayload = browser.execute(function () {
      return window.__requestPayloads[0];
    }).value;

    expect(modifiedPayload.eventData[0].version).toBe('1.0.0');
  });

  it('serializes the eventData.data to a string', function() {
    browser.url('http://localhost:4567/fixtures/v2/onBeforeSendRUM.html');

    browser.pause(4000);

    var firstPayload = browser.execute(function () {
      return window.__requestPayloads[0];
    }).value;

    var typeOfData = typeof firstPayload.eventData[0].data;
    expect(typeOfData === "string").toBe(true);
  });

  it('allows you to cancel sending a payload', function() {
    browser.url('http://localhost:4567/fixtures/v2/onBeforeSendRUM.html');

    browser.pause(4000);

    var allPayloads = browser.execute(function () {
      return window.__requestPayloads;
    }).value;

    expect(allPayloads.length).toBe(1);
  });
});
