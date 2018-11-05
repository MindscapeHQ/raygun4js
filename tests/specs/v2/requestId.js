var webdriverio = require('webdriverio');

describe("Request ID tests", function() {

  // Tests

  it('has a unique request ID for each virtual page request', function() {
    browser.url('http://localhost:4567/fixtures/v2/requestId.html');

    browser.pause(4000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    }).value;

    // If this fails because eventData is undefined it's probably
    // because the virtual pages aren't being sent
    var requestId1 = requestPayloads[1].eventData[0].requestId;
    var requestId2 = requestPayloads[2].eventData[0].requestId;

    expect(requestId1).not.toMatch(requestId2);
  });
});
