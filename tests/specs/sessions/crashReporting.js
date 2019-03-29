var common = require("../common");

describe("Crash Reporting Anonymous User Tracking", function() {
  afterEach(function() {
    browser.execute(function() {
      localStorage.clear();
    });
  });

  describe("with anonymous user tracking", function() {
    it("creates a user id and persists it in localStorage when one doesn't exist", function() {
      browser.url("http://localhost:4567/fixtures/sessions/crWithoutUser.html");

      var result = common.getLocalStorageValue("raygun4js-userid");

      expect(result).not.toBe(null);
    });

    it("retrieves user id from localStorage when one exists", function() {
      browser.execute(function() {
        localStorage.setItem('raygun4js-userid', 'abc123');
      });

      browser.url("http://localhost:4567/fixtures/sessions/crWithoutUser.html");

      var result = common.getLocalStorageValue("raygun4js-userid");
      expect(result).toBe('abc123');
    });

    it("retrieves user id from a cookie and sets it in localStorage", function() {
      common.setCookieValue('raygun4js-userid', 'xyz789');

      browser.url("http://localhost:4567/fixtures/sessions/crWithoutUser.html");

      var result = common.getLocalStorageValue("raygun4js-userid");
      
      expect(result).toBe('xyz789');
      expect(common.getCookieValue('raygun4js-userid')).toBeFalsy();
    });
  });

  describe("with a user set", function() {
    it("doesn't set a user id", function() {
      browser.url("http://localhost:4567/fixtures/sessions/crWithUser.html");

      var result = common.getLocalStorageValue("raygun4js-userid");
      expect(result).toBe(null);
    });
  });
});