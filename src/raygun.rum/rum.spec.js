/*jshint esversion: 6 */

require('./index');

describe("raygun.rum", () => {
    let RUM; 
    let privateMethods;

    beforeEach(() => {
        RUM = new Raygun.RealUserMonitoring(
            "API-KEY",
            "API-URL",
            () => {},
            "user",
            "version",
            ["rum-unit-tests"],
            [],
            [],
            false, //debugMode,
            undefined, //maxVirtualPageDuration,
            true, //ignoreUrlCasing,
            true,
            undefined, //beforeSendCb,
            false, //setCookieAsSecure,
            false, //captureMissingRequests,
            false // automaticPerformanceCustomTimings
        );
        privateMethods = RUM._privateMethods;
    });

    describe("isCustomTimingMeasurement", () => {
        it("returns true when entryType is 'measure'", () => {
            const resource = {
                entryType: 'measure'
            };
            expect(privateMethods.isCustomTimingMeasurement(resource)).toBe(true);
        });
        it("returns false when entryType is not 'measure'", () => {
            const resource = {
                entryType: 'mark'
            };
            expect(privateMethods.isCustomTimingMeasurement(resource)).toBe(false);
        });
        it("returns false when undefined is passed", () => {
            expect(privateMethods.isCustomTimingMeasurement(undefined)).toBe(false);
        });
    });

    describe("getCustomTimingMeasurement", () => {

    });
    
    describe("createCustomTimingMeasurement", () => {

    });
});