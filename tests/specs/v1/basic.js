var webdriverio = require('webdriverio');

describe("Basic Raygun4JS V1 API tests", function() {

  // Setup

  beforeEach(function() {
    browser.url('http://localhost:4567/fixtures/v1/basic.html');
  });

  // Tests

  it('has global Raygun object present', function () {
    var result = browser.execute(function () {
      return typeof Raygun;
    });

    expect(result).toBe('object');
  });

  it('has CR sending function', function () {
    var result = browser.execute(function () {
      return typeof Raygun.send === 'function';
    });

    expect(result).toBe(true);
  });

  it('has RUM trackEvent function', function () {
    var result = browser.execute(function () {
      return typeof Raygun.trackEvent === 'function';
    });

    expect(result).toBe(true);
  });
});
