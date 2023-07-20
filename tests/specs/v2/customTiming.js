var webdriverio = require('webdriverio');

describe("Custom Timing tests", function() {
  beforeEach(async function() {
    /**
     * Clears the session between tests to ensure
     * that the sessionstart event is always fired 
     */
    await browser.reloadSession();
  });

  describe('legacy custom timings', function() {
    beforeEach(async function() {
      await browser.url('http://localhost:4567/fixtures/v2/legacyCustomTiming.html');
      await browser.pause(1000);
    });

    it('sends custom timing events', async function () {
      var customTimingData = await browser.execute(function () {
        return window.__requestPayloads[1];
      });

      expect(JSON.parse(customTimingData.eventData[0].data)[0].customTiming).toEqual({
        custom1: 100,
        custom2: 50
      });
    });
  });
  
  describe('new custom timings', function() {
    beforeEach(async function() {
      await browser.url('http://localhost:4567/fixtures/v2/customTiming.html');
      await browser.pause(1000);
    });

    it('sends custom timing events', async function () {
      var customTimingData = await browser.execute(function () {
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
