/**
 * @prettier
 */

require('./');
require('./errorUtilities');

const fakeHost = 'example.com'
const fakeLocation = `http://${fakeHost}/index.html?qs=1`;

const FakeWindow = {
  location: {
    toString: () => fakeLocation,
    host: fakeHost
  }
};
const FakeRaygun = {
  Utilities: window.raygunUtilityFactory(FakeWindow, {})
};

var errorUtilities = window.raygunErrorUtilitiesFactory(FakeWindow, FakeRaygun);

describe('Error utilities', () => {
  describe('isScriptError', () => {
    describe('with no message', () => {
      it('will return true', () => {
        const stackTrace = {
          stack: [
            {
              line: 0,
              column: 0,
              url: 'http://external.com/index.js',
              func: '?'
            }
          ]
        };
        expect(errorUtilities.isScriptError(stackTrace, {})).toEqual(true);
      });
    });

    describe('with "Script error" message, zero line number from an external domain', () => {
      it('will return true', () => {
        const stackTrace = {
          message: 'Script error',
          stack: [
            {
              line: 0,
              column: 0,
              url: 'http://external.com/index.js',
              func: '?'
            }
          ]
        };
        expect(errorUtilities.isScriptError(stackTrace, {})).toEqual(true);
      });
    });
  });

  describe('isBrowserExtensionError', () => {
    describe('with empty stack array', () => {
      it('will return false', () => {
        const stackTrace = {
          stack: []
        };

        expect(errorUtilities.isBrowserExtensionError(stackTrace)).toEqual(false);
      });
    });

    describe('with null url in stacktrace', () => {
      it('will return false', () => {
        const stackTrace = {
          stack: [
            {
              line: 1,
              column: 23,
              func: '?'
            }
          ]
        };

        expect(errorUtilities.isBrowserExtensionError(stackTrace)).toEqual(false);
      });
    });

    describe('stacktrace with all lines from browser extension', () => {
      it('will return true', () => {
        var stackTrace = {
          stack: [
            {
              line: 2,
              column: 345,
              url: 'chrome-extension://test/index.js',
              func: 'render'
            },
            {
              line: 3,
              column: 45,
              url: 'chrome-extension://test/index.js',
              func: 'show'
            },
            {
              line: 4,
              column: 567,
              url: 'chrome-extension://test2/index.js',
              func: 'run'
            },
          ]
        };

        expect(errorUtilities.isBrowserExtensionError(stackTrace)).toEqual(true);
      });
    });

    describe('stacktrace with a line not from a browser extension', () => {
      it('will return true', () => {
        var stackTrace = {
          stack: [
            {
              line: 3,
              column: 45,
              url: 'moz-extension://test/index.js',
              func: 'run'
            },
            {
              line: null,
              column: null,
              url: null,
              func: 'b'
            },
          ]
        };

        expect(errorUtilities.isBrowserExtensionError(stackTrace)).toEqual(true);
      });
    });

    describe('stacktrace with no lines from a browser extension', () => {
      it('will return false', () => {
        var stackTrace = {
          stack: [
            {
              line: 4,
              column: 567,
              url: 'http://example.com/src/index.js',
              func: 'show'
            },
            {
              line: 3,
              column: 45,
              url: 'http://example.com/src/index.js',
              func: 'run'
            },
          ]
        };

        expect(errorUtilities.isBrowserExtensionError(stackTrace)).toEqual(false);
      });
    });
  });

  describe('isInvalidStackTrace', () => {
    describe('with null stack array', () => {
      it('will return true', () => {
        expect(errorUtilities.isInvalidStackTrace({
          stack: null,
        })).toEqual(true);
      });
    });

    describe('with empty stack array', () => {
      it('will return true', () => {
        expect(errorUtilities.isInvalidStackTrace({
          stack: [],
        })).toEqual(true);
      });
    });

    describe('with all null values in stack lines', () => {
      it('will return true', () => {
        expect(errorUtilities.isInvalidStackTrace({
          stack: [
            {
              line: null,
              column: null,
              url: null,
              func: '?'
            }
          ],
        })).toEqual(true);
      });
    });

    describe('with known error from bot', () => {
      it('will return true', () => {
        expect(errorUtilities.isInvalidStackTrace({
          message: 'Object Not Found Matching Id:1',
          stack: [
            {
              line: null,
              column: null,
              url: null,
              func: 'Z'
            }
          ],
        })).toEqual(true);
      });
    });

    describe('with zero line and column numbers, function is "?"', () => {
      describe('with a url that matches the current location', () => {
        it('will return true', () => {
          expect(errorUtilities.isInvalidStackTrace({
            message: 'ResizeObserver loop limit exceeded',
            stack: [
              {
                line: 0,
                column: 0,
                url: 'http://example.com/index.html',
                func: '?'
              }
            ],
          })).toEqual(true);
        });
      });

      describe('with a url that does not match the current location', () => {
        it('will return true', () => {
          expect(errorUtilities.isInvalidStackTrace({
            message: 'TypeError: undefined is not a function',
            stack: [
              {
                line: 0,
                column: 0,
                url: 'http://other.com/index.html',
                func: '?'
              }
            ],
          })).toEqual(false);
        });
      });

      describe('with valid stacktrace', () => {
        describe('with all valid stack lines', () => {
          it('will return false', () => {
            expect(errorUtilities.isInvalidStackTrace({
              message: 'Cannot read property \'fn\' of undefined',
              stack: [
                {
                  line: 4,
                  column: 162,
                  url: 'http://example.com/index.js',
                  func: 'fn'
                },
                {
                  line: 65,
                  column: 124,
                  url: 'http://example.com/index.js',
                  func: 'run'
                },
              ],
            })).toEqual(false);
          });
        });

        describe('with an invalid stack line', () => {
          it('will return false', () => {
            expect(errorUtilities.isInvalidStackTrace({
              message: 'Cannot read property \'fn\' of undefined',
              stack: [
                {
                  line: 32,
                  column: 88,
                  url: 'http://example.com/index.js',
                  func: 'fn'
                },
                {
                  line: null,
                  column: null,
                  url: null,
                  func: 'Z'
                },
              ],
            })).toEqual(false);
          });
        });
      });
    });
  });

  describe('stackTraceHasValidDomain', () => {
    describe('with bad stacktrace values', () => {
      describe('with null stack array', () => {
        it('will return false', () => {
          expect(errorUtilities.stackTraceHasValidDomain({
            stack: null
          }, [])).toEqual(false);
        });
      });
      describe('with empty stack array', () => {
        it('will return false', () => {
          expect(errorUtilities.stackTraceHasValidDomain({
            stack: []
          }, [])).toEqual(false);
        });
      });
    });

    describe('with valid stacktrace', () => {
      describe('with no whitelisted domains', () => {
        describe('with no line that matches the current domain', () => {
          it('will return false', () => {
            expect(errorUtilities.stackTraceHasValidDomain({
              stack: [
                {
                  line: 1,
                  column: 23,
                  url: 'http://external.com/index.js',
                  func: 'run'
                },
                {
                  line: 2,
                  column: 34,
                  url: 'http://another.com/index.js',
                  func: 'show'
                },
              ]
            }, [])).toEqual(false);
          });
        });

        describe('with one line that matches the current domain', () => {
          it('will return true', () => {
            expect(errorUtilities.stackTraceHasValidDomain({
              stack: [
                {
                  line: 1,
                  column: 23,
                  url: 'http://external.com/index.js',
                  func: 'run'
                },
                {
                  line: 2,
                  column: 34,
                  url: 'http://example.com/index.js',
                  func: 'show'
                },
              ]
            }, [])).toEqual(true);
          });
        });

        describe('with all lines that have urls that match the current domain', () => {
          it('will return true', () => {
            expect(errorUtilities.stackTraceHasValidDomain({
              stack: [
                {
                  line: 1,
                  column: 23,
                  url: 'http://example.com/index.js',
                  func: 'run'
                },
                {
                  line: 2,
                  column: 34,
                  url: 'http://example.com/index.js',
                  func: 'show'
                },
              ]
            }, [])).toEqual(true);
          });
        });
      });

      describe('with whitelisted domains', () => {
        describe('with no line that has a url that matches the current domain', () => {
          describe('no matches to the whitelist', () => {
            it('will return false', () => {
              expect(errorUtilities.stackTraceHasValidDomain({
                stack: [
                  {
                    line: 1,
                    column: 23,
                    url: 'http://external.com/index.js',
                    func: 'run'
                  },
                  {
                    line: 2,
                    column: 34,
                    url: 'http://another.com/index.js',
                    func: 'show'
                  },
                ]
              }, ['api.raygun.com'])).toEqual(false);
            });
          });

          describe('a match with an item in the whitelist', () => {
            it('will return true', () => {
              expect(errorUtilities.stackTraceHasValidDomain({
                stack: [
                  {
                    line: 1,
                    column: 23,
                    url: 'http://external.com/index.js',
                    func: 'run'
                  },
                  {
                    line: 2,
                    column: 34,
                    url: 'http://another.com/index.js',
                    func: 'show'
                  },
                ]
              }, ['another.com'])).toEqual(true);
            });
          });
        });
      });
    });
  });
});
