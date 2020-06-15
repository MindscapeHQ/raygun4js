require('./index');

var raygun = {
    Options: Object.defineProperties({}, {
        _raygunApiKey: {
            get: () => '',
            configurable: true,
            enumerable: true
        },
    }),
    Utilities: null,
};
var utils = window.raygunUtilityFactory(window, raygun);

raygun.Utilities = utils;

describe("raygun.utilities", function() {
    describe("uuid", function() {
        it("generates 36 characters", function() {
            expect(utils.getUuid().length).toBe(36);
        });
    });

    describe("isApiKeyConfigured", function() {
        describe("with the _raygunApiKey set", function() {
            it('returns true', function() {
                spyOnProperty(raygun.Options, "_raygunApiKey").and.returnValue("API-KEY");

                expect(utils.isApiKeyConfigured()).toBe(true);
            });
        });

        describe("without the _raygunApiKey set", function() {
            it('returns false', function() {
                spyOnProperty(raygun.Options, "_raygunApiKey").and.returnValue('');

                expect(utils.isApiKeyConfigured()).toBe(false);
            });
        });
    });

    describe('isReactNative', function() {
        function setGlobalNativeChecks(document, dev) {
            var devBefore = global.__DEV__;
            var documentBefore = global.document;

            global.__DEV__ = dev;
            global.document = document;
            
            return function() {
                global.__DEV__ = devBefore;
                global.document = documentBefore;
            };
        }

        describe('with no document and __DEV__ set', function() {
            it('returns true', function() {
                var reset = setGlobalNativeChecks(undefined, true);
                expect(utils.isReactNative()).toBe(true);
                reset();
            });
        });
        
        describe('with the document defined', function() {
            it('returns false', function() {
                var reset = setGlobalNativeChecks(true, true);
                expect(utils.isReactNative()).toBe(false);
                reset();
            });
        });
        
        describe('with __DEV__ being undefined', function() {
            it('returns false', function() {
                var reset = setGlobalNativeChecks(true, undefined);
                expect(utils.isReactNative()).toBe(false);
                reset();
            });
        });
    });

    describe('storage utilities', function() {
        var storageMethods = [
            ['localStorage', utils.localStorageAvailable],
            ['sessionStorage', utils.sessionStorageAvailable]
        ];

        storageMethods.forEach((method) => describe(`${method[0]}Available`, function() {
            describe('with storage being defined', function() {
                it("returns true", function() {
                    spyOnProperty(global.window, method[0]).and.returnValue(true);
                    expect(method[1]()).toBe(true);
                });
            });
            describe('with storage undefined', function() {
                it('returns false', function() {
                    spyOnProperty(global.window, method[0]).and.returnValue(null);
                    expect(method[1]()).toBe(false);
                });
            });
        }));
    });

    describe('nodeText', function() {
        it("defaults to a empty string", function() {
            expect(utils.nodeText({})).toBe('');
        });

        it("uses innerText if textContent is not defined", function() {
            var node = jasmine.createSpyObj("node", [], { 
                'innerText': "Inner text"
            });
            expect(utils.nodeText(node)).toBe('Inner text');
        });

        it("uses textContent first", function() {
            var node = jasmine.createSpyObj("node", [], { 
                'textContent': "Text content",
                'innerText': "Inner text"
            });
            expect(utils.nodeText(node)).toBe('Text content');
        });

        describe("with nodeType set", function() {
            var nodes = [
                'button',
                'submit'
            ];
            nodes.forEach(nodeName => describe(`as ${nodeName}`, function() {
                it('returns node.value when defined', () => {
                    const node = jasmine.createSpyObj("node", [], { 
                        'textContent': "Text content",
                        'type': nodeName,
                        'value': "Node value"
                    });
                    expect(utils.nodeText(node)).toBe("Node value");
                });

                it('returns normal text when node.value is not defined', function() {
                    const node = jasmine.createSpyObj("node", [], { 
                        'textContent': "Text content",
                        'type': nodeName,
                    });
                    expect(utils.nodeText(node)).toBe("Text content");
                });
            }));
        });
    });

    describe('nodeSelector', function() {
        var nodeTypes = [
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
        
        nodeTypes.forEach((test, index) => describe(`with node#${index}`, function() {
            it(`returns ${test[1]}`, function() {
                const node = jasmine.createSpyObj("node", [], test[0]);
                expect(utils.nodeSelector(node)).toBe(test[1]);
            });
        }));
    });
});