var webdriverio = require('webdriverio');

describe("Basic Raygun4JS V1 API tests", function() {

  // Setup

  beforeEach(function() {
    await browser.url('http://localhost:4567/fixtures/v1/basic.html');
  });

  // Tests

  it('has global Raygun object present', function () {
    var result = await browser.execute(function () {
      return typeof Raygun;
    });

    await expect(result).toBe('object');
  });

  it('has CR sending function', function () {
    var result = await browser.execute(function () {
      return typeof Raygun.send === 'function';
    });

    await expect(result).toBe(true);
  });

  it('has RUM trackEvent function', function () {
    var result = await browser.execute(function () {
      return typeof Raygun.trackEvent === 'function';
    });

    await expect(result).toBe(true);
  });
});
