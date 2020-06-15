require('./index');

let raygun = {
    Options: Object.defineProperties({}, {
        _raygunApiKey: {
            get: () => '',
            configurable: true,
            enumerable: true
        },
    }),
    Utilities: null,
};
const utils = window.raygunUtilityFactory(window, raygun);

raygun.Utilities = utils;

describe("raygun.utilities", () => {
    describe("uuid", () => {
        it("generates 36 characters", () => {
            expect(utils.getUuid().length).toBe(36);
        });
    });

    describe("isApiKeyConfigured", () => {
        describe("with the _raygunApiKey set", () => {
            it('returns true', () => {
                spyOnProperty(raygun.Options, "_raygunApiKey").and.returnValue("API-KEY");

                expect(utils.isApiKeyConfigured()).toBe(true);
            });
        });

        describe("without the _raygunApiKey set", () => {
            it('returns false', () => {
                spyOnProperty(raygun.Options, "_raygunApiKey").and.returnValue('');

                expect(utils.isApiKeyConfigured()).toBe(false);
            });
        });
    });

    describe('isReactNative', () => {
        function setGlobalNativeChecks(document, dev) {
            const devBefore = global.__DEV__;
            const documentBefore = global.document;

            global.__DEV__ = dev;
            global.document = document;
            
            return () => {
                global.__DEV__ = devBefore;
                global.document = documentBefore;
            };
        }

        describe('with no document and __DEV__ set', () => {
            it('returns true', () => {
                const reset = setGlobalNativeChecks(undefined, true);
                expect(utils.isReactNative()).toBe(true);
                reset();
            });
        });
        
        describe('with the document defined', () => {
            it('returns false', () => {
                const reset = setGlobalNativeChecks(true, true);
                expect(utils.isReactNative()).toBe(false);
                reset();
            });
        });
        
        describe('with __DEV__ being undefined', () => {
            it('returns false', () => {
                const reset = setGlobalNativeChecks(true, undefined);
                expect(utils.isReactNative()).toBe(false);
                reset();
            });
        });
    });
});