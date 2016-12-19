var webdriverio = require('webdriverio');
var _ = require('underscore');

describe("Payload functional validation tests for V1", function() {
  
  it("has the error message in the payload set", function () {
    browser.url('http://localhost:4567/fixtures/v1/manualSend.html');

    browser.pause(4000);

    var requestBodies = browser.execute(function () {
      return window.__requestBodies;
    });

    var hasRequest = _.any(requestBodies.value, function (req) {
      return req.args;
    });

    expect(hasRequest).toBe(false);
  });

});