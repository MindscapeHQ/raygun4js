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

    var CoreWebVitals = function(){
        this.cleanWebVitalData = function (event) {
            var res = event;

            if(res.value && res.value.toFixed) {
                res.value = res.value.toFixed(3);
            }
        
            return res;
        };
    };

    CoreWebVitals.prototype.attach = function(queueHandler) {
        queueTimings = queueHandler;

        if(window.webVitals) {
            if(window.webVitals.getLCP) {
                window.webVitals.getLCP(this.handler);
            }

            if(window.webVitals.getFID) {
                window.webVitals.getFID(this.handler);
            }

            if(window.webVitals.getCLS) {
                window.webVitals.getCLS(this.handler);
            }
        }
    };

    CoreWebVitals.prototype.handler = function(event) {
        window.console.log(event);
        if(event.value && event.value.toFixed) {
            event.value = event.value.toFixed(3);
        }

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