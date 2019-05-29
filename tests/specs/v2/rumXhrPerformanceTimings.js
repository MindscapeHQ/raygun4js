/* globals describe, it, expect, browser, window, afterEach, fail */

var _ = require('underscore');

describe("RUM XHR performance timings", function() {

  afterEach(function() {
    browser.reload();
  });

  function payloadsWithoutRaygunApi(payloads) {
    return _.sortBy(_.filter(payloads, function(payload) {
      return payload.url.indexOf('raygun') === -1;
    }), function(payload) { return payload.url; });
  }


  function checkAssetTimings() {
    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    }).value;

    if (requestPayloads.length < 3) {
      fail("test did not wait long enough for ajax requests to be sent to Raygun");
    }

    var timingPayload = payloadsWithoutRaygunApi(JSON.parse(requestPayloads[2].eventData[0].data));

    var expectedPairs = [
      {url: 'https://jsonplaceholder.typicode.com/posts', type: 'XHR POST request to an external domain'},
      {url: 'https://jsonplaceholder.typicode.com/posts/1', type: 'XHR DELETE request to an external domain'},
      {url: 'https://jsonplaceholder.typicode.com/users', type: 'XHR GET request to an external domain'},
    ];

    for (var i = 0; i < expectedPairs.length; i++) {
      var payloadUrl = timingPayload[i].url;
      var payloadTimingType = timingPayload[i].timing.t;
      var pairUrl = expectedPairs[i].url;
      var pairType = expectedPairs[i].type;

      expect(payloadUrl).toBe(pairUrl, "failed for type: " + pairType);
      expect(payloadTimingType).toBe('x', "failed for type: " + pairType);
    }
  }

  it("marks cors XHR timing types as 'x'", function () {
    browser.url('http://localhost:4567/fixtures/v2/rumXhrPerformanceTimings.html');

    browser.pause(35000);

    checkAssetTimings();
  });

});
