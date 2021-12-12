var webdriverio = require('webdriverio');

describe("Basic Raygun4JS V2 API tests", function() {

  // Setup

  beforeEach(function() {
    browser.url('http://localhost:4567/fixtures/v2/basic.html');
  });

  // Tests

  it('has global rg4js object present', function () {
    var result = browser.execute(function () {
      return typeof rg4js === 'function';
    });

    expect(result).toBe(true);
  });

  it('has global Raygun object present', function () {
    var result = browser.execute(function () {
      return typeof Raygun === 'object';
    });

    expect(result).toBe(true);
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