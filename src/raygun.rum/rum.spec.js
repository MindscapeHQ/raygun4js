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
        
    });

    describe("getCustomTimingMeasurement", () => {

    });
    
    describe("createCustomTimingMeasurement", () => {

    });
});