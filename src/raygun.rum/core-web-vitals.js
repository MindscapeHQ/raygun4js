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

var webVitals = require('web-vitals');

function raygunCoreWebVitalFactory() {
    var WebVitalTimingType = "w";
    var queueTimings = null;
    var _parentResource = null;

    var CoreWebVitals = function(){
        this.cleanWebVitalData = function (event) {
            var res = event;

            if(res.value && res.value.toFixed) {
                res.value = res.value.toFixed(3);
            }
        
            return res;
        };
    };

    CoreWebVitals.prototype.attach = function(queueHandler, parentResource) {
        queueTimings = queueHandler;
        _parentResource = parentResource;

        webVitals.onLCP(this.handler);
        webVitals.onFID(this.handler);
        webVitals.onCLS(this.handler);
        webVitals.onINP(this.handler);
    };

    CoreWebVitals.prototype.handler = function(event) {
        if(event.value && event.value.toFixed) {
            event.value = event.value.toFixed(3);
        }

        var webVitalEvent = {
            url: event.name,
            timing: {
                t: WebVitalTimingType,
                du: event.value
            },
            parentResource: _parentResource
        };

        queueTimings(webVitalEvent);
    };

    return new CoreWebVitals();
}

window.raygunCoreWebVitalFactory = raygunCoreWebVitalFactory;