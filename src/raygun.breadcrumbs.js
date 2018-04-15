/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2017 MindscapeHQ
 * Licensed under the MIT license.
 */
/* globals console */

window.raygunBreadcrumbsFactory = function(window, Raygun) {
    function urlMatchesIgnoredHosts(url, ignoredHosts) {
        for (var i = 0;i < ignoredHosts.length;i ++) {
            var host = ignoredHosts[i];

            if (typeof host === 'string' && url && url.indexOf(host) > -1) {
                return true;
            } else if (typeof host === 'object' && host.exec(url)) {
                return true;
            }
        }

        return false;
    }

    var Breadcrumbs = function() {
        this.MAX_BREADCRUMBS = 32;
        this.MAX_MESSAGE_SIZE = 1024;
        this.BREADCRUMB_LEVELS = ['debug', 'info', 'warning', 'error'];
        this.DEFAULT_BREADCRUMB_LEVEL = 'info';
        this.DEFAULT_XHR_IGNORED_HOSTS = ['raygun'];

        this.breadcrumbLevel = 'info';
        this.logXhrContents = false;
        this.xhrIgnoredHosts = [].concat(this.DEFAULT_XHR_IGNORED_HOSTS);
        this.breadcrumbs = [];
        this.wrapWithHandler = function(method) {
            return function() {
                try {
                    return method.apply(this, arguments);
                } catch (ex) {
                    Raygun.Utilities.log(ex);
                }
            };
        };

        this.disableConsoleFunctions = [];
        this.disableNavigationFunctions = [];
        this.disableXHRLogging = function() {};
        this.disableClicksTracking = function() {};

        this.enableAutoBreadcrumbs();
        this.wrapPrototypeWithHandlers();
    };

    Breadcrumbs.prototype.recordBreadcrumb = function(value, metadata) {
        var crumb = {
            level: this.DEFAULT_BREADCRUMB_LEVEL,
            timestamp: new Date().getTime(),
            type: 'manual'
        };

        switch (typeof value) {
            case "object":
                    crumb = Raygun.Utilities.merge(crumb, value);
                break;
            case "string":
                crumb = Raygun.Utilities.merge(
                    Raygun.Utilities.merge(
                        crumb, {
                            message: value,
                            metadata: metadata
                        }
                    )
                );
                break;
            default:
                Raygun.Utilities.log(
                    "expected first argument to recordBreadcrumb to be a 'string' or 'object', got " + typeof value
                );
                return;
        }

        if (this.BREADCRUMB_LEVELS.indexOf(crumb.level) === -1) {
            Raygun.Utilities.log(
                "unknown breadcrumb level " + crumb.level + " setting to default of '" + this.DEFAULT_BREADCRUMB_LEVEL + "'"
            );
            crumb.level = this.DEFAULT_BREADCRUMB_LEVEL;
        }

        if (this.shouldRecord(crumb)) {
            crumb.message = Raygun.Utilities.truncate(crumb.message, this.MAX_MESSAGE_SIZE);

            this.breadcrumbs.push(crumb);
            this.breadcrumbs = this.breadcrumbs.slice(-this.MAX_BREADCRUMBS);
        }
    };

    Breadcrumbs.prototype.shouldRecord = function(crumb) {
        var crumbLevel = this.BREADCRUMB_LEVELS.indexOf(crumb.level);
        var activeLevel = this.BREADCRUMB_LEVELS.indexOf(this.breadcrumbLevel);

        return crumbLevel >= activeLevel;
    };

    Breadcrumbs.prototype.setBreadcrumbLevel = function(level) {
        if (this.BREADCRUMB_LEVELS.indexOf(level) === -1) {
            Raygun.Utilities.log(
                "Breadcrumb level of '" + level + "' is invalid, setting to default of '" + this.DEFAULT_BREADCRUMB_LEVEL + "'"
            );

            return;
        }

        this.breadcrumbLevel = level;
    };

    Breadcrumbs.prototype.setOption = function(option, value) {
        if (option === 'breadcrumbsLevel') {
            this.setBreadcrumbLevel(value);
        } else if (option === 'xhrIgnoredHosts') {
            this.xhrIgnoredHosts = value.concat(this.DEFAULT_XHR_IGNORED_HOSTS);

            var self = this;
            this.removeBreadcrumbsWithPredicate(function(crumb) {
                if (crumb.type !== 'request') {
                    return false;
                }

                return urlMatchesIgnoredHosts(crumb.metadata.requestURL || crumb.metadata.responseURL, self.xhrIgnoredHosts);
            });
        } else if (option === 'logXhrContents') {
            this.logXhrContents = value;
        }
    };

    Breadcrumbs.prototype.any = function() {
        return this.breadcrumbs.length > 0;
    };

    Breadcrumbs.prototype.all = function() {
        var sanitizedBreadcrumbs = [];

        for (var i = 0; i < this.breadcrumbs.length; i++) {
            var crumb = this.breadcrumbs[i];

            if (crumb.type === 'request' && !this.logXhrContents) {
                if (crumb.metadata.responseText) {
                    crumb.metadata.responseText = 'Disabled';
                }

                if (crumb.metadata.requestText) {
                    crumb.metadata.requestText = undefined;
                }
            }

            sanitizedBreadcrumbs.push(crumb);
        }

        return sanitizedBreadcrumbs;
    };

    Breadcrumbs.prototype.enableAutoBreadcrumbs = function() {
        this.enableAutoBreadcrumbsXHR();
        this.enableAutoBreadcrumbsClicks();
        this.enableAutoBreadcrumbsConsole();
        this.enableAutoBreadcrumbsNavigation();
    };

    Breadcrumbs.prototype.disableAutoBreadcrumbs = function() {
        this.disableAutoBreadcrumbsXHR();
        this.disableAutoBreadcrumbsClicks();
        this.disableAutoBreadcrumbsConsole();
        this.disableAutoBreadcrumbsNavigation();
    };

    Breadcrumbs.prototype.removeBreadcrumbsWithPredicate = function(predicate) {
        var crumbs = this.breadcrumbs;
        var filteredCrumbs = [];

        for (var i = 0;i < crumbs.length;i++) {
            var crumb = crumbs[i];

            if (!predicate(crumb)) {
                filteredCrumbs.push(crumb);
            }
        }

        this.breadcrumbs = filteredCrumbs;
    };

    Breadcrumbs.prototype.removeCrumbsOfType = function(type) {
        this.removeBreadcrumbsWithPredicate(function(crumb) {
            return crumb.type === type;
        });
    };

    Breadcrumbs.prototype.enableAutoBreadcrumbsConsole = function() {
        if (typeof window.console === "undefined") {
            return;
        }

        var logConsoleCall = function logConsoleCall(severity, args) {
            var stringifiedArgs = [];

            for (var i = 0;i < args.length;i++) {
                var arg = args[i];
                if (arg === null || arg === undefined) {
                    continue;
                }

                stringifiedArgs.push(arg.toString());
            }

            this.recordBreadcrumb({
                type: 'console',
                level: severity,
                message: Array.prototype.slice.call(stringifiedArgs).join(", ")
            });
        }.bind(this);

        var consoleProperties = ['log', 'warn', 'error'];
        var self = this;
        this.disableConsoleFunctions = consoleProperties.map(function(property) {
            return Raygun.Utilities.enhance(console, property, self.wrapWithHandler(function() {
                var severity = property === "log" ? "info" : property === "warn" ? "warning" : "error";

                logConsoleCall(severity, arguments);
            }));
        });
    };

    Breadcrumbs.prototype.disableAutoBreadcrumbsConsole = function() {
        this.disableConsoleFunctions.forEach(function(unenhance) { unenhance(); } );
        this.removeCrumbsOfType('console');
    };

    Breadcrumbs.prototype.enableAutoBreadcrumbsNavigation = function() {
        if (!window.addEventListener || !window.history || !window.history.pushState) {
            return;
        }

        var buildStateChange = function(name, state, title, url) {
            var currentPath = location.pathname + location.search + location.hash;
            var prevState = null;

            if (window.history.state) {
                prevState = history.state;
            }

            return {
                message: 'History ' + name,
                type: 'navigation',
                level: 'info',
                metadata: {
                    from: currentPath,
                    to: url || currentPath,
                    prevState: JSON.stringify(prevState) || 'unsupported',
                    nextState: JSON.stringify(state)
                }
            };
        }.bind(this);

        var parseHash = function(url) {
            return url.split("#")[1] || "";
        };

        var historyFunctionsToEnhance = ["pushState", "replaceState"];
        this.disableNavigationFunctions = this.disableNavigationFunctions.concat(
            historyFunctionsToEnhance.map(function(stateChange) {
                return Raygun.Utilities.enhance(history, stateChange, this.wrapWithHandler(function(state, title, url) {
                    this.recordBreadcrumb(buildStateChange(stateChange, state, title, url));
                }.bind(this)));
            }.bind(this))
        );

        var buildHashChange = function(e) {
            var oldURL = e.oldURL;
            var newURL = e.newURL;
            var metadata;

            if (oldURL && newURL) {
                metadata = {
                    from: parseHash(oldURL),
                    to: parseHash(newURL)
                };
            } else {
                metadata = {
                    to: location.hash
                };
            }

            return {
                type: 'navigation',
                message: 'Hash change',
                metadata: metadata
            };
        };

        var logBreadcrumbWrapper = function(handler) {
            return this.wrapWithHandler(function() {
                this.recordBreadcrumb(handler.apply(null, arguments));
            }.bind(this));
        }.bind(this);
        var eventsWithHandlers = [
            {element: window, event: 'hashchange', handler: buildHashChange},
            {element: window, event: 'load', handler: function() {
                return { type: 'navigation', message: 'Page loaded'};
            }},
            {element: window, event: 'popstate', handler: function() {
                return { type: 'navigation', message: 'Navigated back' };
            }},
            {element: window, event: 'pagehide', handler: function() {
                return { type: 'navigation', message: 'Page hidden' };
            }},
            {element: window, event: 'pageshow', handler: function() {
                return { type: 'navigation', message: 'Page shown' };
            }},
            {element: document, event: 'DOMContentLoaded', handler: function() {
                return { type: 'navigation', message: 'DOMContentLoaded' };
            }},
        ];

        this.disableNavigationFunctions = this.disableNavigationFunctions.concat(
            eventsWithHandlers.map(function(mapping) {
                return Raygun.Utilities.addEventHandler(mapping.element, mapping.event, logBreadcrumbWrapper(mapping.handler));
            }.bind(this))
        );
    };

    Breadcrumbs.prototype.disableAutoBreadcrumbsNavigation = function() {
        this.disableNavigationFunctions.forEach(function(unenhance) { unenhance(); });
        this.disableNavigationFunctions = [];

        this.removeCrumbsOfType('navigation');
    };


    Breadcrumbs.prototype.enableAutoBreadcrumbsClicks = function() {
        this.disableClicksTracking = Raygun.Utilities.addEventHandler(window, 'click', this.wrapWithHandler(function(e) {
            var text, selector;

            try {
                text = Raygun.Utilities.truncate(Raygun.Utilities.nodeText(e.target), 150);
                selector = Raygun.Utilities.nodeSelector(e.target);
            } catch(exception) {
                text = "[unknown]";
                selector = "[unknown]";

                Raygun.Utilities.log("Error retrieving node text/selector. Most likely due to a cross domain error");
            }

            this.recordBreadcrumb({
                type: 'click-event',
                message: 'UI Click',
                level: 'info',
                metadata: {
                    text: text,
                    selector: selector
                }
            });
        }.bind(this), true));
    };

    Breadcrumbs.prototype.disableAutoBreadcrumbsClicks = function() {
        this.disableClicksTracking();
        this.removeCrumbsOfType('click-event');
    };

    Breadcrumbs.prototype.enableAutoBreadcrumbsXHR = function() {
        var self = this;

        if (!window.XMLHttpRequest.prototype.addEventListener) {
            this.disableXHRLogging = function() {};
            return;
        }

        this.disableXHRLogging = Raygun.Utilities.enhance(window.XMLHttpRequest.prototype, 'open', self.wrapWithHandler(function() {
            var initTime = new Date().getTime();
            var url = arguments[1] || "Unknown";
            var method = arguments[0];

            if (urlMatchesIgnoredHosts(url, self.xhrIgnoredHosts)) {
                return;
            }

            Raygun.Utilities.enhance(this, 'send', self.wrapWithHandler(function() {
                var metadata = {
                    method: method,
                    requestURL: url,
                };

                if (arguments[0] && typeof(arguments[0]) === 'string') {
                    metadata.requestText = Raygun.Utilities.truncate(arguments[0], 500);
                }

                self.recordBreadcrumb({
                    type: 'request',
                    message: 'Opening request to ' + url,
                    level: 'info',
                    metadata: metadata
                });
            }));


            this.addEventListener('load', self.wrapWithHandler(function() {
                var responseText = 'N/A for non text responses';

                if ((this.responseType === '' || this.responseType === 'text')) {
                    responseText = Raygun.Utilities.truncate(this.responseText, 500);
                }

                self.recordBreadcrumb({
                    type: 'request',
                    message: 'Finished request to ' + url,
                    level: 'info',
                    metadata: {
                        status: this.status,
                        requestURL: url,
                        responseURL: this.responseURL,
                        responseText: responseText,
                        duration: new Date().getTime() - initTime + "ms"
                    }
                });
            }));
            this.addEventListener('error', self.wrapWithHandler(function() {
                self.recordBreadcrumb({
                    type: 'request',
                    message: 'Failed request to ' + url,
                    level: 'info',
                    metadata: {
                        status: this.status,
                        requestURL: url,
                        responseURL: this.responseURL,
                        duration: new Date().getTime() - initTime + "ms"
                    }
                });
            }));
            this.addEventListener('abort', self.wrapWithHandler(function() {
                self.recordBreadcrumb({
                    type: 'request',
                    message: 'Request to ' + url + 'aborted',
                    level: 'info',
                    metadata: {
                        requestURL: url,
                        duration: new Date().getTime() - initTime + "ms"
                    }
                });
            }));
        }));
    };

    Breadcrumbs.prototype.disableAutoBreadcrumbsXHR = function() {
        this.disableXHRLogging();
        this.removeCrumbsOfType('request');
    };


    Breadcrumbs.prototype.wrapPrototypeWithHandlers = function() {
        var name, method;
        for(name in Breadcrumbs.prototype) {
            method = Breadcrumbs.prototype[name];
            if (typeof method === "function") {
                Breadcrumbs.prototype[name] = this.wrapWithHandler(method);
            }
        }
    };

    return Breadcrumbs;
};
