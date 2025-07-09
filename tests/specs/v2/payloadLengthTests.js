var _ = require('underscore');

describe("Large payload support tests for v2 manual send", function() {

  it("supports very large error messages (>1000 characters)", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/manualSendVeryLongMessage.html');

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads, function (payload) {
      return payload.Details.Error.Message.length > 1000;
    });

    expect(passes).toBe(true);
  });
});
