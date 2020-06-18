/*jshint esversion: 6 */

require('./index');

describe("raygun.rum", () => {
    let RUM; 
    let utils;

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
        utils = RUM.Utilities;
    });

    describe("isCustomTimingMeasurement", () => {
        it("returns true when entryType is 'measure'", () => {
            const resource = {
                entryType: 'measure'
            };
            expect(utils.isCustomTimingMeasurement(resource)).toBe(true);
        });
        it("returns false when entryType is not 'measure'", () => {
            const resource = {
                entryType: 'mark'
            };
            expect(utils.isCustomTimingMeasurement(resource)).toBe(false);
        });
        it("returns false when undefined is passed", () => {
            expect(utils.isCustomTimingMeasurement(undefined)).toBe(false);
        });
    });
    
    describe("createCustomTimingMeasurement", () => {
        it('returns a custom timing entry', () => {
            expect(utils.createCustomTimingMeasurement("test", 100, 200)).toEqual({
                url: 'test',
                timing: {
                    t: 't',
                    du: '100.00',
                    a: '200.00'
                }
            });
        });
        
        describe('with floating point numbers passed', () => {
            it('all numbers are fixed to 2 decimal places', () => {
                expect(utils.createCustomTimingMeasurement("test", 100.123, 200.123)).toEqual({
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
            it('returns a object with the offset equal to 0.00', () => {
                expect(utils.createCustomTimingMeasurement("test", 100)).toEqual({
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
        it('returns a custom timing entry', () => {
            const resource = {
                name: 'test-resource',
                startTime: 1000,
                duration: 2000,
            };

            expect(utils.getCustomTimingMeasurement(resource)).toEqual({
                url: 'test-resource',
                timing: {
                    t: 't',
                    du: '2000.00',
                    a: '1000.00'
                }
            });
        });
    });
});