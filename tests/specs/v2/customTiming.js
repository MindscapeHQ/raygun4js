var webdriverio = require('webdriverio');

describe("Custom Timing tests", function() {
  beforeEach(function() {
    /**
     * Clears the session between tests to ensure
     * that the sessionstart event is always fired 
     */
    browser.reloadSession();
  });

  describe('legacy custom timings', function() {
    beforeEach(function() {
      browser.url('http://localhost:4567/fixtures/v2/legacyCustomTiming.html');
      browser.pause(1000);
    });

    it('sends custom timing events', function () {
      var customTimingData = browser.execute(function () {
        return window.__requestPayloads[1];
      });

      expect(JSON.parse(customTimingData.eventData[0].data)[0].customTiming).toEqual({
        custom1: 100,
        custom2: 50
      });
    });
  });
  
  describe('new custom timings', function() {
    beforeEach(function() {
      browser.url('http://localhost:4567/fixtures/v2/customTiming.html');
      browser.pause(1000);
    });

    it('sends custom timing events', function () {
      var customTimingData = browser.execute(function () {
        return window.__requestPayloads[2];
      });

      expect(JSON.parse(customTimingData.eventData[0].data)[0]).toEqual({
        timing: {
          a: "0.00",
          du: "100.00",
          t: "t"
        }, 
        url: "timingName",
        parentResource: { url: 'http://localhost:4567/fixtures/v2/customTiming.html', type: 'p' }
      });
    });
  });
});
