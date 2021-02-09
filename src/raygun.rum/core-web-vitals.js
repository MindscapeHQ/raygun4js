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


function raygunCoreWebVitalFactory(window) {
    var WebVitalTimingType = "w";
    var queueTimings = null;

    var CoreWebVitals = function() {};

    CoreWebVitals.prototype.attach = function(queueHandler) {
        queueTimings = queueHandler;

        if(window.webVitals) {
            window.webVitals.getLCP(this.handler);
            window.webVitals.getFID(this.handler);
            window.webVitals.getCLS(this.handler);
        }
    };

    CoreWebVitals.prototype.handler = function(event) {
        var webVitalEvent = {
            url: event.name,
            timing: {
                t: WebVitalTimingType,
                du: event.value
            }
        };

        queueTimings(webVitalEvent);
    };

    return new CoreWebVitals();
}

window.raygunCoreWebVitalFactory = raygunCoreWebVitalFactory;
