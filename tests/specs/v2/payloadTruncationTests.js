var _ = require('underscore');
var common = require('../common');

var _entriesEndpoint = 'https://api.raygun.io/entries';

describe("Large payload support tests for v2 manual send", function() {

  it("supports very large error messages (>1000 characters)", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/manualSendVeryLongMessage.html');

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = await _.any(requestPayloads, function (payload) {
      return payload.Details.Error.Message.length > 1000;
    });

    await expect(passes).toBe(true);
  });

});
