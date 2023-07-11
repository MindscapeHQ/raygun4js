var webdriverio = require('webdriverio');

describe("Request ID tests", function() {

  // Tests

  it('has a unique request ID for each virtual page request', async function() {
    await browser.url('http://localhost:4567/fixtures/v2/requestId.html');

    await browser.pause(1000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    // If this fails because eventData is undefined it's probably
    // because the virtual pages aren't being sent
    var requestId1 = requestPayloads[1].eventData[0].requestId;
    var requestId2 = requestPayloads[2].eventData[0].requestId;

    expect(requestId1 !== requestId2).toBeTrue(requestId2);
  });
});
