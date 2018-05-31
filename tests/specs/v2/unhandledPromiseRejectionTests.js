var webdriverio = require('webdriverio');
var _ = require('underscore');

describe("Unhandled promise rejection", function() {
    // Tests

    it('sends error on unhandled promise rejection', function() {
        browser.url('http://localhost:4567/fixtures/v2/unhandledPromiseRejection.html');
        browser.pause(4000);

        var supportsUnHandledRejections = browser.execute(function() {
            return window.supportsOnunhandledrejection;
        }).value;

        if(supportsUnHandledRejections) {
          var requestPayloads = browser.execute(function () {
              return payload.Details.Error.Message.indexOf('rejected promise') > -1;
          }).value;

          expect(requestPayloads.value).toBe(true);
        }
    });
});
