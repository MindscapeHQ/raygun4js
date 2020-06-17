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
    
    describe("createCustomTimingMeasurement", () => {
        it('returns a custom timing entry', () => {
            expect(privateMethods.createCustomTimingMeasurement("test", 100, 200)).toEqual({
                url: 'test',
                timing: {
                    t: 't',
                    du: '100.00',
                    a: '200.00'
                }
            });
        });
        
        describe('with floating point numbers passed', () => {
            it('returns a custom timing entry with entries rounded to 2 decimal places', () => {
                expect(privateMethods.createCustomTimingMeasurement("test", 100.123, 200.123)).toEqual({
                    url: 'test',
                    timing: {
                        t: 't',
                        du: '100.12',
                        a: '200.12'
                    }
                });
            });
        });

        describe('when no offset passed', () => {
            it('offset is 0', () => {
                expect(privateMethods.createCustomTimingMeasurement("test", 100)).toEqual({
                    url: 'test',
                    timing: {
                        t: 't',
                        du: '100.00',
                        a: '0.00'
                    }
                });
            });
        });
    });

    describe("getCustomTimingMeasurement", () => {

    });
});