/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2017 MindscapeHQ
 * Licensed under the MIT license.
 */
/* globals console */

var raygunBreadcrumbsFactory = function(window, $, Raygun) {
    Raygun.Breadcrumbs = function(debugMode) {
        this.debugMode = debugMode;
        this.breadcrumbLevel = 'info';
        this.breadcrumbs = [];
        this.BREADCRUMB_LEVELS = ['debug', 'info', 'warning', 'error'];
        this.DEFAULT_BREADCRUMB_LEVEL = 'info';

        this.disableConsoleFunctions = [];
        this.disableNavigationFunctions = [];

        this.enableAutoBreadcrumbsConsole();
        this.enableAutoBreadcrumbsNavigation();

        // This constructor gets called during the page loaded event, so we can't hook into it
        // Instead, just leave the breadcrumb manually
        this.recordBreadcrumb({message: 'Page loaded', type: 'navigation'});
        console.log('wadasda');
    };

    Raygun.Breadcrumbs.prototype.recordBreadcrumb = function(value, metadata) {
        var crumb = {
            level: this.DEFAULT_BREADCRUMB_LEVEL,
            timestamp: new Date().getTime()
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
                        }
                    ),
                    metadata
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
            this.breadcrumbs.push(crumb);
        }
    };

    Raygun.Breadcrumbs.prototype.shouldRecord = function(crumb) {
        var crumbLevel = this.BREADCRUMB_LEVELS.indexOf(crumb.level);
        var activeLevel = this.BREADCRUMB_LEVELS.indexOf(this.breadcrumbLevel);

        return crumbLevel >= activeLevel;
    };

    Raygun.Breadcrumbs.prototype.any = function() {
        return this.breadcrumbs.length > 0;
    };

    Raygun.Breadcrumbs.prototype.all = function() {
        return this.breadcrumbs;
    };

    Raygun.Breadcrumbs.prototype.enableAutoBreadcrumbsConsole = function() {
        if (typeof window.console === "undefined") {
            return;
        }

        var consoleProperties = ['log', 'warn', 'error'];

        var logConsoleCall = function logConsoleCall(severity, args) {
            this.recordBreadcrumb({
                type: 'console',
                level: severity,
                message: Array.prototype.slice.call(args).join(", ")
            });
        }.bind(this);

        this.disableConsoleFunctions = consoleProperties.map(function(property) {
            return Raygun.Utilities.enhance(console, property, function() {
                var severity = property === "log" ? "info" : property === "warn" ? "warning" : "error";

                logConsoleCall(severity, arguments);
            });
        });
    };

    Raygun.Breadcrumbs.prototype.disableAutoBreadcrumbsConsole = function() {
        this.disableConsoleFunctions.forEach(function(unenhance) { unenhance(); } );
    };

    Raygun.Breadcrumbs.prototype.enableAutoBreadcrumbsNavigation = function() {
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
                    prevState: prevState || 'unsupported',
                    nextState: state
                }
            };
        }.bind(this);

        var parseHash = function(url) {
            return url.split("#")[1] || "";
        };

        var historyFunctionsToEnhance = ["pushState", "replaceState"];
        this.disableNavigationFunctions = this.disableNavigationFunctions.concat(
            historyFunctionsToEnhance.map(function(stateChange) {
                return Raygun.Utilities.enhance(history, stateChange, function(state, title, url) {
                    this.recordBreadcrumb(buildStateChange(stateChange, state, title, url));
                }.bind(this));
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

        var eventsWithHandlers = [
            {event: 'hashchange', handler: buildHashChange},
            {event: 'popstate', handler: function() {
                return { type: 'navigation', message: 'Navigated back' };
            }},
            {event: 'pagehide', handler: function() {
                return { type: 'navigation', message: 'Page hidden' };
            }},
            {event: 'pageshow', handler: function() {
                return { type: 'navigation', message: 'Page shown' };
            }},
            {event: 'DOMContentLoaded', handler: function() {
                return { type: 'navigation', message: 'DOMContentLoaded' };
            }},
        ];

        this.disableNavigationFunctions = this.disableNavigationFunctions.concat(
            eventsWithHandlers.map(function(mapping) {
                return Raygun.Utilities.addEventHandler(window, mapping.event, mapping.handler);
            }.bind(this))
        );
    };

    Raygun.Breadcrumbs.prototype.disableAutoBreadcrumbsNavigation = function() {
        this.disableNavigationFunctions.forEach(function(unenhance) { unenhance(); });
        this.disableNavigationFunctions = [];
    };
};

raygunBreadcrumbsFactory(window, window.jQuery, window.__instantiatedRaygun);
