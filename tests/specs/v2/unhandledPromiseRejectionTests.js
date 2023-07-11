var webdriverio = require('webdriverio');
var _ = require('underscore');

describe("Unhandled promise rejection", function() {
    // Tests

    it('sends error on unhandled promise rejection', async function() {
        await browser.url('http://localhost:4567/fixtures/v2/unhandledPromiseRejection.html');
        await browser.pause(1000);

        var supportsUnHandledRejections = await browser.execute(function() {
            return window.supportsOnunhandledrejection;
        });

        if(supportsUnHandledRejections) {
            await browser.pause(1000);

            var requestPayloads = await browser.execute(function () {
                return window.__requestPayloads;
            });
            var unhandledPromise = requestPayloads[0].Details.Error.Message.indexOf('rejected promise') > -1;

            expect(unhandledPromise).toBeTrue();
        }
    });

    describe('with no reason provided for rejection', function() {
        it('sends an error with a relevant message and no stacktrace data', async function() {
            await browser.url('http://localhost:4567/fixtures/v2/unhandledPromiseRejectionWithNoReason.html');
            await browser.pause(1000);

            var supportsUnHandledRejections = await browser.execute(function() {
                return window.supportsOnunhandledrejection;
            });

            if (supportsUnHandledRejections) {
                await browser.pause(1000);

                var requestPayloads = await browser.execute(function () {
                    return window.__requestPayloads;
                });

                var errorPayload = requestPayloads[0].Details.Error;

                expect(errorPayload.Message).toEqual('Unhandled promise rejection');
                expect(errorPayload.StackTrace.length).toEqual(1);
                expect(errorPayload.StackTrace[0].LineNumber).toBeNull();
                expect(errorPayload.StackTrace[0].ColumnNumber).toBeNull();
            }
        });
    });
});
