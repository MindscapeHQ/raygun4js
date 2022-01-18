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

    var CoreWebVitals = function () {
        this.counter = 0;

        this.cleanWebVitalData = function (event) {
            var res = event;

            if (res.value && res.value.toFixed) {
                res.value = res.value.toFixed(3);
            }

            return res;
        };

        this.getDebugInfo = function (name, entries) {
            var firstEntry = entries[0];
            var lastEntry = entries[entries.length - 1];
            // window.console.log("Node", entries);
            var getNodePath = function (node, cwv) {
                window.console.log("Node for " + cwv, node);

                try {
                    var name = node.nodeName.toLowerCase();
                    if (name === 'body') {
                        return 'html>body';
                    }
                    if (node.id) {
                        return name + " #" + node.id;
                    }
                    if (node.className && node.className.length) {
                        name += node.classList.values().join('.');
                    }
                    return getNodePath(node.parentElement, cwv) + ">" + name;
                } catch (error) {
                    return '(error)';
                }
            };

            switch (name) {
                case 'LCP':
                    if (lastEntry) {
                        return getNodePath(lastEntry.element, 'lcp');
                    }
                    break;

                case 'FID':
                    if (firstEntry) {
                        return firstEntry.name + " " + getNodePath(firstEntry.target, 'FID');
                    }
                    break;

                case 'CLS':
                    window.console.log("CLS", entries);
                    if (entries.length) {
                        var largestShift = entries.reduce(function (a, b) {
                            return a && a.value > b.value ? a : b;
                        });
                        if (largestShift && largestShift.sources) {
                            var largestSource = largestShift.sources.reduce(function (a, b) {
                                return a.node && a.previousRect.width * a.previousRect.height >
                                    b.previousRect.width * b.previousRect.height ? a : b;
                            });

                            if (largestSource) {
                                return getNodePath(largestSource.node, 'cls');
                            }
                        }
                    }
                    break;

                default:
                    return '(not set)';
            }
        };
    };

    CoreWebVitals.prototype.attach = function (queueHandler) {
        queueTimings = queueHandler;

        if (typeof window !== 'undefined' && window.webVitals) {
            if (window.webVitals.getLCP) {
                window.webVitals.getLCP(this.handler);
            }

            if (window.webVitals.getFID) {
                window.webVitals.getFID(this.handler);
            }

            if (window.webVitals.getCLS) {
                window.webVitals.getCLS(this.handler);
            }
        }
    };

    CoreWebVitals.prototype.handler = function (event) {
        if (event.value && event.value.toFixed) {
            event.value = event.value.toFixed(3);
        }

        window.console.log(event);
        var info = this.Raygun.CoreWebVitals.getDebugInfo(event.name, event.entries);
        window.console.log(info);

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