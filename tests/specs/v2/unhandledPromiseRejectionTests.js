var webdriverio = require('webdriverio');
var _ = require('underscore');

describe("Unhandled promise rejection tests", function() {

    // Tests

    it('sends error on unhandled promise rejection', function() {
        browser.url('http://localhost:4567/fixtures/v2/unhandledPromiseRejection.html');

        browser.pause(4000);

        var requestPayloads = browser.execute(function () {
            return window.__requestPayloads;
        }).value;

        var passes = _.any(requestPayloads.value, function (payload) {
            return payload.Details.Error.Message.indexOf('rejected promise') > -1;
        });

        expect(passes).toBe(true);

        expect(requestId1).not.toMatch(requestId2);
    });
});
