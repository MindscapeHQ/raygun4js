var common = require("../common");

describe("RUM Session Tracking", function() {

  // Tests

  // rum
    // - persists session id into storage when it doesn't exist
    // - retrieves session id from storage when it exists 
    // - creates new session id if it has expired
    // - retrieved session id timestamp is updated when it already exists 
    // retrieves identifier from cookie and sets it in sessionStorage

  afterEach(function() {
    await browser.execute(function() {
      localStorage.clear();
    });
  });

  it("persists a session id into storage when one doesn't exist", function() {
    await browser.url("http://localhost:4567/fixtures/sessions/rumSession.html");

    var result = await common.getLocalStorageValue("raygun4js-sid");
    await expect(result).not.toBe(null);
  });

  it("uses the session id and updates the timestamp when it is found and is less than 30 minutes old", function() {
    var oneMinuteAgoTimestamp = new Date(new Date() - 60000).toISOString();

    await browser.execute(function(timestamp) {
      var sessionValue = 'abc123';
      
      var sessionString = 'id|' + sessionValue + '&timestamp|' + timestamp;
      localStorage.setItem('raygun4js-sid', sessionString);
    }, oneMinuteAgoTimestamp);

    await browser.url("http://localhost:4567/fixtures/sessions/rumSession.html");

    var result = await common.getLocalStorageValue("raygun4js-sid")

    const set = result.split(/[|&]/);

    await expect(set.length).toBe(4);
    await expect(set[0]).toBe('id');
    await expect(set[1]).toBe('abc123');
    await expect(set[2]).toBe('timestamp');

    var newTimestampIsGreater = new Date(set[3]) > new Date(oneMinuteAgoTimestamp);
    await expect(newTimestampIsGreater).toBe(true);
  });
  
  it("retrieves session id from a cookie and sets it in localStorage", function() {
    var sessionValue = 'cookieId';
    var timestamp = new Date(new Date() - 60000).toISOString();
    var cookieValue = 'id|' + sessionValue + '&timestamp|' + timestamp;

    await common.setCookieValue('raygun4js-sid', cookieValue);

    await browser.url("http://localhost:4567/fixtures/sessions/rumSession.html");

    var result = await common.getLocalStorageValue("raygun4js-sid")

    const set = result.split(/[|&]/);

    await expect(set.length).toBe(4);
    await expect(set[0]).toBe('id');
    await expect(set[1]).toBe('cookieId');

    await expect(await common.getCookieValue('raygun4js-sid')).toBeFalsy();
  });
  
  describe('creates a new session id', function() {
    it("creates a new session id if the session id is older than 30 minutes", function() {
      await browser.execute(function() {
        var sessionValue = 'expiredId';
        var oneHourAgoTimestamp = new Date(new Date() - 60 * 60000).toISOString();
        var sessionString = 'id|' + sessionValue + '&timestamp|' + oneHourAgoTimestamp;
        localStorage.setItem('raygun4js-sid', sessionString);
      });

      await browser.url("http://localhost:4567/fixtures/sessions/rumSession.html");

      var result = await common.getLocalStorageValue("raygun4js-sid")

      await expect(result.indexOf('id|expiredId')).toBe(-1);
      await expect(result.split('&')[0]).not.toBe('id|expiredId');
    });

    it("creates a new session id if value stored is null", function() {
      await browser.execute(function() {
        localStorage.setItem('raygun4js-sid', null);
      });

      await browser.url("http://localhost:4567/fixtures/sessions/rumSession.html");

      var result = await common.getLocalStorageValue("raygun4js-sid")
      await expect(result).not.toBe(null);
    });
  });
});