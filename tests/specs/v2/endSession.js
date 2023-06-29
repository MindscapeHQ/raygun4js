var webdriverio = require('webdriverio');

describe('endSession', function() {

  //Setup
  beforeEach(function() {
    await browser.reloadSession();
    await browser.url('http://localhost:4567/fixtures/v2/customTiming.html');
  });


  //Tests
  it('generates a new session id and saves to storage', function() {

    var sessionId = await browser.execute(function () {
      return localStorage.getItem("raygun4js-sid");
    });

    var newSessionId = await browser.execute(function () {
      rg4js('endSession');
      return localStorage.getItem("raygun4js-sid");
    });

    expect(newSessionId).toBeTruthy;
    await expect(sessionId).not.toBe(newSessionId);
  });

  it('sends a session_end and session_start event', function() {

    await browser.execute(function () {
      rg4js('endSession');
    });

    var endSessionPayload = await browser.execute(function () {
      var timings = window.__requestPayloads[2];
      return timings.eventData[0].type;
    });

    var startSessionPayload = await browser.execute(function () {
      var timings = window.__requestPayloads[3];
      return timings.eventData[0].type;
    });

    await expect(endSessionPayload).toEqual("session_end");
    await expect(startSessionPayload).toEqual("session_start");
  });
});
