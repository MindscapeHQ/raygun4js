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

    describe('storage utilities', () => {
        const storageMethods = [
            ['localStorage', utils.localStorageAvailable],
            ['sessionStorage', utils.sessionStorageAvailable]
        ];

        storageMethods.forEach((method) => describe(`${method[0]}Available`, () => {
            describe('with storage being defined', () => {
                it("returns true", () => {
                    spyOnProperty(global.window, method[0]).and.returnValue(true);
                    expect(method[1]()).toBe(true);
                });
            });
            describe('with storage undefined', () => {
                it('returns false', () => {
                    spyOnProperty(global.window, method[0]).and.returnValue(null);
                    expect(method[1]()).toBe(false);
                });
            });
        }));
    });

    describe('nodeText', () => {
        it("defaults to a empty string", () => {
            expect(utils.nodeText({})).toBe('');
        });

        it("uses innerText if textContent is not defined", () => {
            const node = jasmine.createSpyObj("node", [], { 
                'innerText': "Inner text"
            });
            expect(utils.nodeText(node)).toBe('Inner text');
        });

        it("uses textContent first", () => {
            const node = jasmine.createSpyObj("node", [], { 
                'textContent': "Text content",
                'innerText': "Inner text"
            });
            expect(utils.nodeText(node)).toBe('Text content');
        });

        describe("with nodeType set", () => {
            const nodes = [
                'button',
                'submit'
            ];
            nodes.forEach(nodeName => describe(`as ${nodeName}`, () => {
                it('returns node.value when defined', () => {
                    const node = jasmine.createSpyObj("node", [], { 
                        'textContent': "Text content",
                        'type': nodeName,
                        'value': "Node value"
                    });
                    expect(utils.nodeText(node)).toBe("Node value");
                });

                it('returns normal text when node.value is not defined', () => {
                    const node = jasmine.createSpyObj("node", [], { 
                        'textContent': "Text content",
                        'type': nodeName,
                    });
                    expect(utils.nodeText(node)).toBe("Text content");
                });
            }));
        });
    });

    describe('nodeSelector', () => {
        const nodeTypes = [
            [{
                tagName: 'button',
            }, 'button'],
            [{
                tagName: 'button',
                id: 'submit',
            }, 'button#submit'],
            [{
                tagName: 'button',
                id: 'submit',
                className: 'className'
            }, 'button#submit.className'],
            [{
                tagName: 'button',
                id: 'submit',
                className: 'classNameOne classNameTwo'
            }, 'button#submit.classNameOne.classNameTwo']
        ];
        
        nodeTypes.forEach((test, index) => describe(`with node#${index}`, () => {
            it(`returns ${test[1]}`, () => {
                const node = jasmine.createSpyObj("node", [], test[0]);
                expect(utils.nodeSelector(node)).toBe(test[1]);
            });
        }));
    });
});