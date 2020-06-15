/*jshint esversion: 6 */

/** 
 * Mocks the global window object.
 * This way we can assert against some data
 */
global.window = Object.defineProperties({}, {
    'localStorage': {
        get: () => null,
        configurable: true,
        enumerable: true
    },
    'sessionStorage': {
        get: () => null,
        configurable: true,
        enumerable: true
    }
});

