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
    browser.execute(function() {
      localStorage.clear();
    });
  });

  it("persists a session id into storage when one doesn't exist", function() {
    browser.url("http://localhost:4567/fixtures/sessions/rumSession.html");

    var result = common.getLocalStorageValue("raygun4js-sid");
    expect(result).not.toBe(null);
  });

  it("uses the session id and updates the timestamp when it is found and is less than 30 minutes old", function() {
    var oneMinuteAgoTimestamp = new Date(new Date() - 60000).toISOString();

    browser.execute(function(timestamp) {
      var sessionValue = 'abc123';
      
      var sessionString = 'id|' + sessionValue + '&timestamp|' + timestamp;
      localStorage.setItem('raygun4js-sid', sessionString);
    }, oneMinuteAgoTimestamp);

    browser.url("http://localhost:4567/fixtures/sessions/rumSession.html");

    var result = common.getLocalStorageValue("raygun4js-sid")

    const set = result.split(/[|&]/);

    expect(set.length).toBe(4);
    expect(set[0]).toBe('id');
    expect(set[1]).toBe('abc123');
    expect(set[2]).toBe('timestamp');

    var newTimestampIsGreater = new Date(set[3]) > new Date(oneMinuteAgoTimestamp);
    expect(newTimestampIsGreater).toBe(true);
  });
  
  it("retrieves session id from a cookie and sets it in localStorage", function() {
    var sessionValue = 'cookieId';
    var timestamp = new Date(new Date() - 60000).toISOString();
    var cookieValue = 'id|' + sessionValue + '&timestamp|' + timestamp;

    common.setCookieValue('raygun4js-sid', cookieValue);

    browser.url("http://localhost:4567/fixtures/sessions/rumSession.html");

    var result = common.getLocalStorageValue("raygun4js-sid")

    const set = result.split(/[|&]/);

    expect(set.length).toBe(4);
    expect(set[0]).toBe('id');
    expect(set[1]).toBe('cookieId');

    expect(common.getCookieValue('raygun4js-sid')).toBeFalsy();
  });
  
  describe('creates a new session id', function() {
    it("creates a new session id if the session id is older than 30 minutes", function() {
      browser.execute(function() {
        var sessionValue = 'expiredId';
        var oneHourAgoTimestamp = new Date(new Date() - 60 * 60000).toISOString();
        var sessionString = 'id|' + sessionValue + '&timestamp|' + oneHourAgoTimestamp;
        localStorage.setItem('raygun4js-sid', sessionString);
      });

      browser.url("http://localhost:4567/fixtures/sessions/rumSession.html");

      var result = common.getLocalStorageValue("raygun4js-sid")

      expect(result.indexOf('id|expiredId')).toBe(-1);
      expect(result.split('&')[0]).not.toBe('id|expiredId');
    });

    it("creates a new session id if value stored is null", function() {
      browser.execute(function() {
        localStorage.setItem('raygun4js-sid', null);
      });

      browser.url("http://localhost:4567/fixtures/sessions/rumSession.html");

      var result = common.getLocalStorageValue("raygun4js-sid")
      expect(result).not.toBe(null);
    });
  });
});