/*jshint esversion: 6 */

// Mock for Raygun object
var RaygunObject = {};
global.Raygun = RaygunObject;

// Function to store event handlers
function storeEventHandler(eventType, handler) {
    if (!global._eventHandlers[eventType]) {
        global._eventHandlers[eventType] = [];
    }
    global._eventHandlers[eventType].push(handler);
}

// Function to simulate an event
function simulateEvent(eventType) {
    if (global._eventHandlers[eventType]) {
        global._eventHandlers[eventType].forEach(handler => handler());
    }
}

// Initializing global event handlers storage
global._eventHandlers = {};

// Mock implementations
global.addEventListener = function(eventType, handler, useCapture) {
    storeEventHandler(eventType, handler);
};

global._simulateEvent = simulateEvent;

// Mock for global window object
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
    },
    '__instantiatedRaygun': {
        get: () => RaygunObject,
        configurable: true,
        enumerable: true
    }
});

// Mock for global document object
global.document = {};