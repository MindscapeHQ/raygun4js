/**
 * @prettier
 */

/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2021 MindscapeHQ
 * Licensed under the MIT license.
 */

var WebVitalTimingType = "w";

window.raygunCoreWebVitalFactory = function(window) {
    var CoreWebVitals = function(){};

    CoreWebVitals.prototype.attach = function() {
        window.webVitals.getLCP(this.handler);
        window.webVitals.getFID(this.handler);
        window.webVitals.getCLS(this.handler);
    };

    CoreWebVitals.prototype.handler = function(event) {
        var webVitalEvent = {
            name: event.name,
            timing: {
                t: WebVitalTimingType,
                du: event.value
            }
        };
    
        window.console.log(webVitalEvent);
    };

    return new CoreWebVitals();
};