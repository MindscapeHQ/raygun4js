/* globals describe, it, expect, browser, window, afterEach, fail */

var _ = require('underscore');

describe("RUM status code tracking", function() {

  afterEach(function() {
    await browser.reloadSession();
  });

  async function payloadsWithoutRaygunApi(payloads) {
    return _.sortBy(_.filter(payloads, function(payload) {
      return payload.url.indexOf('raygun') === -1;
    }), function(payload) { return payload.url; });
  }


  async function checkStatusCodes() {
    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    if (requestPayloads.length < 3) {
      await fail("test did not wait long enough for ajax requests to be sent to Raygun");
    }

    var timingPayload = await payloadsWithoutRaygunApi(JSON.parse(requestPayloads[2].eventData[0].data));

    var expectedPairs = [
      {url: 'http://localhost:4567/fixtures/v2/foo.html', statusCode: 404, type: 'relative url that does not exist'},
      {url: 'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html', statusCode: 200, type: 'plain relative url'},
      {url: 'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html', statusCode: 200, type: 'relative url with query string'},
      {url: 'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html', statusCode: 200, type: 'absolute url'},
    ];

    for (var i = 0;i < expectedPairs.length; i++) {
      var payloadUrl = timingPayload[i].url;
      var payloadStatus = timingPayload[i].statusCode;
      var payloadDataType = timingPayload[i].timing.t;

      var pairUrl = expectedPairs[i].url;
      var pairStatus = expectedPairs[i].statusCode;
      var pairType = expectedPairs[i].type;

      await expect(payloadUrl).toBe(pairUrl, "failed for type: " + pairType);
      await expect(payloadStatus).toBe(pairStatus, "failed for type: " + pairType);
      await expect(payloadDataType).toBe(payloadDataType, "XHR data type missing for: " + pairType);
    }
  }


  it("attaches the status codes to xhr calls for XmlHttpRequest", function () {
    await browser.url('http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html');

    await browser.pause(35000);

    await checkStatusCodes();
  });

  it("attaches status codes to requests for fetch requests", function() {
    await browser.url('http://localhost:4567/fixtures/v2/rumFetchStatusCodes.html');

    await browser.pause(1000);

    var supportsFetch = await browser.execute(function() {
      return window.supportsFetch;
    });

    if (!supportsFetch) {
      return;
    }

    await browser.pause(35000);

    await checkStatusCodes();
  });

  describe('with the global window.fetch objects saved as a reference', () => {
    describe('and using the minified.fetchhandler.js code snippet', () => {
      it('attaches status codes to requests', async () => {
        await browser.url('http://localhost:4567/fixtures/v2/rumReferencedFetchWithFetchSnippet.html');

        await browser.pause(1000);
    
        var supportsFetch = await browser.execute(function() {
          return window.supportsFetch;
        });
    
        if (!supportsFetch) {
          return;
        }

        await browser.pause(35000);

        await checkStatusCodes();
      });

      it('overriden fetch methods are stilled called', async () => {
        await browser.url('http://localhost:4567/fixtures/v2/rumReferencedFetchWithFetchSnippet.html');

        await browser.pause(1000);
    
        var supportsFetch = await browser.execute(function() {
          return window.supportsFetch;
        });
    
        if (!supportsFetch) {
          return;
        }

        await browser.pause(35000);

        var completedCalls = await browser.execute(function () {
          return window.__completedCalls;
        });
    
        if (completedCalls.length < 4) {
          await fail("test did not wait long enough for ajax requests to be sent to Raygun");
        }
    
        var expectedCalls = [
          'foo.html',
          'rumXhrStatusCodes.html', 
          'rumXhrStatusCodes.html?foo=bar', 
          'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html'
        ];

        for (var i = 0; i < expectedCalls.length; i++) {
          var url = expectedCalls[i];
          await expect(completedCalls.indexOf(url)).not.toBe(-1);
        }
      });
    });
  });

  it("attaches the status codes for polyfilled fetch requests", function() {
    await browser.url('http://localhost:4567/fixtures/v2/rumFetchPolyfillStatusCodes.html');

    await browser.pause(35000);

    await checkStatusCodes();
  });
});
