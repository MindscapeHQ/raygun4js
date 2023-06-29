var webdriverio = require('webdriverio');
var _ = require('underscore');

describe("Unhandled promise rejection", function() {
    // Tests

    it('sends error on unhandled promise rejection', function() {
        await browser.url('http://localhost:4567/fixtures/v2/unhandledPromiseRejection.html');
        await browser.pause(1000);

        var supportsUnHandledRejections = await browser.execute(function() {
            return window.supportsOnunhandledrejection;
        });

        if(supportsUnHandledRejections) {
            await browser.pause(10000);

            var requestPayloads = await browser.execute(function () {
                return window.__requestPayloads;
            });
            var unhandledPromise = requestPayloads[0].Details.Error.Message.indexOf('rejected promise') > -1;

            await expect(unhandledPromise).toBe(true);
        }
    });

    describe('with no reason provided for rejection', function() {
        it('sends an error with a relevant message and no stacktrace data', function() {
            await browser.url('http://localhost:4567/fixtures/v2/unhandledPromiseRejectionWithNoReason.html');
            await browser.pause(1000);

            var supportsUnHandledRejections = await browser.execute(function() {
                return window.supportsOnunhandledrejection;
            });

            if (supportsUnHandledRejections) {
                await browser.pause(10000);

                var requestPayloads = await browser.execute(function () {
                    return window.__requestPayloads;
                });

                var errorPayload = requestPayloads[0].Details.Error;

                await expect(errorPayload.Message).toEqual('Unhandled promise rejection');
                await expect(errorPayload.StackTrace.length).toEqual(1);
                await expect(errorPayload.StackTrace[0].LineNumber).toBeNull();
                await expect(errorPayload.StackTrace[0].ColumnNumber).toBeNull();
            }
        });
    });
});
