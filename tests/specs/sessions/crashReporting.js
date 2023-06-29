var common = require("../common");

describe("Crash Reporting Anonymous User Tracking", function() {
  afterEach(function() {
    await browser.execute(function() {
      localStorage.clear();
    });
  });

  describe("with anonymous user tracking", function() {
    it("creates a user id and persists it in localStorage when one doesn't exist", function() {
      await browser.url("http://localhost:4567/fixtures/sessions/crWithoutUser.html");

      var result = await common.getLocalStorageValue("raygun4js-userid");

      await expect(result).not.toBe(null);
    });

    it("retrieves user id from localStorage when one exists", function() {
      await browser.execute(function() {
        localStorage.setItem('raygun4js-userid', 'abc123');
      });

      await browser.url("http://localhost:4567/fixtures/sessions/crWithoutUser.html");

      var result = await common.getLocalStorageValue("raygun4js-userid");
      await expect(result).toBe('abc123');
    });

    it("retrieves user id from a cookie and sets it in localStorage", function() {
      await common.setCookieValue('raygun4js-userid', 'xyz789');

      await browser.url("http://localhost:4567/fixtures/sessions/crWithoutUser.html");

      var result = await common.getLocalStorageValue("raygun4js-userid");
      
      await expect(result).toBe('xyz789');
      await expect(await common.getCookieValue('raygun4js-userid')).toBeFalsy();
    });
  });

  describe("with a user set", function() {
    it("doesn't set a user id", function() {
      await browser.url("http://localhost:4567/fixtures/sessions/crWithUser.html");

      var result = await common.getLocalStorageValue("raygun4js-userid");
      await expect(result).toBe(null);
    });
  });
});