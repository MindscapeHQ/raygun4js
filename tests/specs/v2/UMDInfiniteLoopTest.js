var webdriverio = require('webdriverio');

describe("UMD Infinite loop test", function() {
    beforeEach(async function() {
        /**
         * Clears the session between tests to ensure
         * that the sessionstart event is always fired 
         */
        await browser.reloadSession();
    });

    describe('test infinite loop is not caused', function() {
        beforeEach(async function() {
            await browser.url('http://localhost:4567/fixtures/v2/UMDInfiniteLoop.html');
            await browser.pause(1000);
        });

        it('succesfully sends the event', async function() {
            var customTimingData = await browser.execute(function() {
                console.log(window.__requestPayloads)
                return window.__requestPayloads[2];
            });
            console.log(customTimingData.eventData[0].data);
            expect(JSON.parse(customTimingData.eventData[0].data)[0]).toEqual({
                timing: {
                    a: "0.00",
                    du: "100.00",
                    t: "t"
                },
                url: "timingName",
                parentResource: { url: 'http://localhost:4567/fixtures/v2/UMDInfiniteLoop.html', type: 'p' }
            });
        });
    });
});
