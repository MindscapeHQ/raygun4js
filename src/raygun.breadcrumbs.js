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

        this.unenhanceConsoleFunctions = [];

        this.enableAutoBreadcrumbsConsole();
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

        this.unenhanceConsoleProperties = consoleProperties.map(function(property) {
            return Raygun.Utilities.enhance(console, property, function() {
                var severity = property === "log" ? "info" : property === "warn" ? "warning" : "error";

                logConsoleCall(severity, arguments);
            });
        });
    };

    Raygun.Breadcrumbs.prototype.disableAutoBreadcrumbsConsole = function() {
        this.unenhanceConsoleProperties.forEach(function(unenhance) { unenhance(); } );
    };
};

raygunBreadcrumbsFactory(window, window.jQuery, window.__instantiatedRaygun);
