var webdriverio = require('webdriverio');
var _ = require('underscore');

describe("Unhandled promise rejection", function() {
    // Tests

    it('sends error on unhandled promise rejection', function() {
        browser.url('http://localhost:4567/fixtures/v2/unhandledPromiseRejection.html');
        browser.pause(1000);

        var supportsUnHandledRejections = browser.execute(function() {
            return window.supportsOnunhandledrejection;
        });

        if(supportsUnHandledRejections) {
            browser.pause(10000);

            var requestPayloads = browser.execute(function () {
                return window.__requestPayloads;
            });
            var unhandledPromise = requestPayloads[0].Details.Error.Message.indexOf('rejected promise') > -1;

            expect(unhandledPromise).toBe(true);
        }
    });

    describe('with no reason provided for rejection', function() {
        it('sends an error with a relevant message and no stacktrace data', function() {
            browser.url('http://localhost:4567/fixtures/v2/unhandledPromiseRejectionWithNoReason.html');
            browser.pause(1000);

            var supportsUnHandledRejections = browser.execute(function() {
                return window.supportsOnunhandledrejection;
            });

            if (supportsUnHandledRejections) {
                browser.pause(10000);

                var requestPayloads = browser.execute(function () {
                    return window.__requestPayloads;
                });

                var errorPayload = requestPayloads[0].Details.Error;

                expect(errorPayload.Message).toEqual('Unhandled promise rejection');
                expect(errorPayload.StackTrace[0].LineNumber).toBeNull();
                expect(errorPayload.StackTrace[0].ColumnNumber).toBeNull();
            }
        });
    });
});
