/* globals describe, it, expect, browser, window, afterEach, fail */

var _ = require('underscore');

describe("RUM status code tracking", function() {

  beforeEach(function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
});


  afterEach(async function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;

    await browser.reloadSession();
  });

  function payloadsWithoutRaygunApi(payloads) {
    return _.sortBy(_.filter(payloads, function(payload) {
      return payload.url.indexOf('raygun') === -1;
    }), function(payload) { return payload.url; });
  }


  async function checkStatusCodes() {
    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });


    if (requestPayloads.length < 3) {
      fail("test did not wait long enough for ajax requests to be sent to Raygun");
    }


    var timingPayload =  payloadsWithoutRaygunApi(JSON.parse(requestPayloads[2].eventData[0].data));

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

      expect(payloadUrl === pairUrl).toBeTrue("failed for type: " + pairType);
      expect(payloadStatus === pairStatus).toBeTrue( "failed for type: " + pairType);
      expect(payloadDataType === payloadDataType).toBeTrue( "XHR data type missing for: " + pairType);
    }
  }


  it("attaches the status codes to xhr calls for XmlHttpRequest", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html');

    await browser.pause(40000);

    await checkStatusCodes();
  });

  it("attaches status codes to requests for fetch requests", async function() {
    await browser.url('http://localhost:4567/fixtures/v2/rumFetchStatusCodes.html');

    await browser.pause(40000);

    var supportsFetch = await browser.execute(function() {
      return window.supportsFetch;
    });

    if (!supportsFetch) {
      return;
    }

   

    await checkStatusCodes();
  });

  describe('with the global window.fetch objects saved as a reference', () => {
    describe('and using the minified.fetchhandler.js code snippet', () => {
      it('attaches status codes to requests', async () => {
        await browser.url('http://localhost:4567/fixtures/v2/rumReferencedFetchWithFetchSnippet.html');

        await browser.pause(50000);
    
        var supportsFetch = await browser.execute(function() {
          return window.supportsFetch;
        });
    
        if (!supportsFetch) {
          return;
        }

        await checkStatusCodes();
      });

      it('overriden fetch methods are stilled called', async () => {
        await browser.url('http://localhost:4567/fixtures/v2/rumReferencedFetchWithFetchSnippet.html');

        await browser.pause(40000);
    
        var supportsFetch = await browser.execute(function() {
          return window.supportsFetch;
        });
    
        if (!supportsFetch) {
          return;
        }

        var completedCalls = await browser.execute(function () {
          return window.__completedCalls;
        });
    
        if (completedCalls.length < 4) {
          fail("test did not wait long enough for ajax requests to be sent to Raygun");
        }
    
        var expectedCalls = [
          'foo.html',
          'rumXhrStatusCodes.html', 
          'rumXhrStatusCodes.html?foo=bar', 
          'http://localhost:4567/fixtures/v2/rumXhrStatusCodes.html'
        ];

        for (var i = 0; i < expectedCalls.length; i++) {
          var url = expectedCalls[i];
          expect(completedCalls.indexOf(url) !== -1).toBeTrue();
        }
      });
    });
  });

  it("attaches the status codes for polyfilled fetch requests", async function() {
    await browser.url('http://localhost:4567/fixtures/v2/rumFetchPolyfillStatusCodes.html');

    await browser.pause(40000);

    await checkStatusCodes();
  });
});
