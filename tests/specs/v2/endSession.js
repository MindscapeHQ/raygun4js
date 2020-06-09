var webdriverio = require('webdriverio');

describe('endSession', function() {

    //Setup
  beforeEach(function() {
		browser.reloadSession();
		browser.url('http://localhost:4567/fixtures/v2/customTiming.html');
  });

  it('generates a new session id and saves to storage', function() {

    var sessionId = browser.execute(function () {
        return localStorage.getItem("raygun4js-sid");
      });

    var newSessionId = browser.execute(function () {
        rg4js('endSession');
        return localStorage.getItem("raygun4js-sid");
    })

    expect(newSessionId).toBeTruthy;
    expect(sessionId).not.toBe(newSessionId);
  });

  it('sends a session_end and session_start event', function() {

		browser.execute(function () {
			rg4js('endSession');
		})

		var endSessionPayload = browser.execute(function () {
			var timings = window.__requestPayloads[2];
			return timings.eventData[0].type
		})

		var startSessionPayload = browser.execute(function () {
			var timings = window.__requestPayloads[3];
			return timings.eventData[0].type;
		})


		expect(endSessionPayload).toEqual("session_end");
		expect(startSessionPayload).toEqual("session_start");
	});
});
