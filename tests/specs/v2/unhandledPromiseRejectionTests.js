var webdriverio = require('webdriverio');
var _ = require('underscore');

describe("Unhandled promise rejection", function() {
    // Tests

    it('sends error on unhandled promise rejection', function() {
        browser.url('http://localhost:4567/fixtures/v2/unhandledPromiseRejection.html');
        browser.pause(1000);

        var supportsUnHandledRejections = browser.execute(function() {
            return window.supportsOnunhandledrejection;
        }).value;

        if(supportsUnHandledRejections) {
            browser.pause(10000);

            var requestPayloads = browser.execute(function () {
                return window.__requestPayloads;
            }).value;
            var unhandledPromise = requestPayloads[0].Details.Error.Message.indexOf('rejected promise') > -1;

            expect(unhandledPromise).toBe(true);
        }
    });
});
