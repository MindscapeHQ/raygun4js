var webdriverio = require('webdriverio');

describe("Custom Timing tests", function() {

  // Setup

  beforeEach(function() {
    browser.url('http://localhost:4567/fixtures/v2/customTiming.html');

    browser.pause(1000);
  });

  // Tests

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
