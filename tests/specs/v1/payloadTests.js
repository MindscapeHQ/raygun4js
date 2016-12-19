var webdriverio = require('webdriverio');
var _ = require('underscore');

describe("Payload functional validation tests for V1", function() {
  
  it("has the error message in the payload set", function () {
    browser.url('http://localhost:4567/fixtures/v1/manualSend.html');

    browser.pause(4000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var hasPayload = _.any(requestPayloads.value, function (payload) {
      return payload.Details.Error.Message === 'Manual send';
    });

    expect(hasPayload).toBe(true);
  });

  it("has the classname in the payload set", function () {
    browser.url('http://localhost:4567/fixtures/v1/manualSend.html');

    browser.pause(4000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var hasPayload = _.any(requestPayloads.value, function (payload) {
      return payload.Details.Error.ClassName === 'Error';
    });

    expect(hasPayload).toBe(true);
  });

  it("has the filename in the stacktrace payload set", function () {
    var pageUrl = 'http://localhost:4567/fixtures/v1/manualSend.html';

    browser.url(pageUrl);

    browser.pause(4000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var hasPayload = _.any(requestPayloads.value, function (payload) {
      return payload.Details.Error.StackTrace[0].FileName === pageUrl;
    });

    expect(hasPayload).toBe(true);
  });

});

