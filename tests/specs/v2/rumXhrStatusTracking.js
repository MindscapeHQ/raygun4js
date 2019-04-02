/* globals describe, it, expect, browser, window, fail */

var _ = require('underscore');

describe("RUM status code tracking", function() {

  function payloadsWithoutRaygunApi(payloads) {
    return _.filter(payloads, function(payload) {
      return payload.url.indexOf('raygun') === -1;
    });
  }

  it("attaches the status codes to xhr calls for XmlHttpRequest", function () {
    browser.url('http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html');

    browser.pause(30000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    }).value;

    if (requestPayloads.length < 3) {
      fail("test did not wait long enough for ajax requests to be sent to Raygun");
    }

    var timingPayload = payloadsWithoutRaygunApi(JSON.parse(requestPayloads[2].eventData[0].data));

    var pairs = [
      {url: 'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html', status: 200, type: 'plan relative url'},
      {url: 'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html', status: 200, type: 'relative url with query string'},
      {url: 'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html', status: 200, type: 'absolute url'},
      {url: 'http://localhost:4567/fixtures/v2/foo.html', status: 404, type: 'relative url that does not exist'},
    ];

    for (var i = 0;i < pairs.length; i++) {
      var payloadUrl = timingPayload[i].url;
      var payloadStatus = timingPayload[i].status;
      var pairUrl = pairs[i].url;
      var pairStatus = pairs[i].status;
      var pairType = pairs[i].type;

      expect(payloadUrl).toBe(pairUrl, "failed for type: " + pairType);
      expect(payloadStatus).toBe(pairStatus, "failed for type: " + pairType);
    }
  });

  it("attaches status codes to requests for fetch requests", function() {
    browser.url('http://localhost:4567/fixtures/v2/rumFetchStatusCodes.html');

    browser.pause(1000);

    var supportsFetch = browser.execute(function() {
      return window.supportsFetch;
    }).value;

    if (!supportsFetch) {
      return;
    }

    browser.pause(29000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    }).value;

    if (requestPayloads.length < 2) {
      fail("test did not wait long enough for ajax requests to be sent to Raygun");
    }

    var timingPayload = payloadsWithoutRaygunApi(JSON.parse(requestPayloads[1].eventData[0].data));

    var pairs = [
      {url: 'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html', status: 200, type: 'plan relative url'},
      {url: 'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html', status: 200, type: 'relative url with query string'},
      {url: 'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html', status: 200, type: 'absolute url'},
      {url: 'http://localhost:4567/fixtures/v2/foo.html', status: 404, type: 'relative url that does not exist'},
    ];

    for (var i = 0;i < pairs.length; i++) {
      var payloadUrl = timingPayload[i].url;
      var payloadStatus = timingPayload[i].status;
      var pairUrl = pairs[i].url;
      var pairStatus = pairs[i].status;
      var pairType = pairs[i].type;

      expect(payloadUrl).toBe(pairUrl, "failed for type: " + pairType);
      expect(payloadStatus).toBe(pairStatus, "failed for type: " + pairType);
    }
  });

  it("attaches the status codes for polyfilled fetch requests", function() {
    browser.url('http://localhost:4567/fixtures/v2/rumFetchPolyfillStatusCodes.html');

    browser.pause(30000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    }).value;

    if (requestPayloads.length < 2) {
      fail("test did not wait long enough for ajax requests to be sent to Raygun");
    }

    var timingPayload = payloadsWithoutRaygunApi(JSON.parse(requestPayloads[1].eventData[0].data));

    var pairs = [
      {url: 'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html', status: 200, type: 'plan relative url'},
      {url: 'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html', status: 200, type: 'relative url with query string'},
      {url: 'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html', status: 200, type: 'absolute url'},
      {url: 'http://localhost:4567/fixtures/v2/foo.html', status: 404, type: 'relative url that does not exist'},
    ];

    for (var i = 0;i < pairs.length; i++) {
      var payloadUrl = timingPayload[i].url;
      var payloadStatus = timingPayload[i].status;
      var pairUrl = pairs[i].url;
      var pairStatus = pairs[i].status;
      var pairType = pairs[i].type;

      expect(payloadUrl).toBe(pairUrl, "failed for type: " + pairType);
      expect(payloadStatus).toBe(pairStatus, "failed for type: " + pairType);
    }
  });
});
