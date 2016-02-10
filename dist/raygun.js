/*! Raygun4js - v2.2.3 - 2016-01-26
* https://github.com/MindscapeHQ/raygun4js
* Copyright (c) 2016 MindscapeHQ; Licensed MIT */
(function(window, undefined) {


var TraceKit = {};
var _oldTraceKit = window.TraceKit;

// global reference to slice
var _slice = [].slice;
var UNKNOWN_FUNCTION = '?';


/**
 * _has, a better form of hasOwnProperty
 * Example: _has(MainHostObject, property) === true/false
 *
 * @param {Object} host object to check property
 * @param {string} key to check
 */
function _has(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function _isUndefined(what) {
    return typeof what === 'undefined';
}

/**
 * TraceKit.noConflict: Export TraceKit out to another variable
 * Example: var TK = TraceKit.noConflict()
 */
TraceKit.noConflict = function noConflict() {
    window.TraceKit = _oldTraceKit;
    return TraceKit;
};

/**
 * TraceKit.wrap: Wrap any function in a TraceKit reporter
 * Example: func = TraceKit.wrap(func);
 *
 * @param {Function} func Function to be wrapped
 * @return {Function} The wrapped func
 */
TraceKit.wrap = function traceKitWrapper(func) {
    function wrapped() {
        try {
            return func.apply(this, arguments);
        } catch (e) {
            TraceKit.report(e);
            throw e;
        }
    }
    return wrapped;
};

/**
 * TraceKit.report: cross-browser processing of unhandled exceptions
 *
 * Syntax:
 *   TraceKit.report.subscribe(function(stackInfo) { ... })
 *   TraceKit.report.unsubscribe(function(stackInfo) { ... })
 *   TraceKit.report(exception)
 *   try { ...code... } catch(ex) { TraceKit.report(ex); }
 *
 * Supports:
 *   - Firefox: full stack trace with line numbers, plus column number
 *              on top frame; column number is not guaranteed
 *   - Opera:   full stack trace with line and column numbers
 *   - Chrome:  full stack trace with line and column numbers
 *   - Safari:  line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *   - IE:      line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *
 * In theory, TraceKit should work on all of the following versions:
 *   - IE5.5+ (only 8.0 tested)
 *   - Firefox 0.9+ (only 3.5+ tested)
 *   - Opera 7+ (only 10.50 tested; versions 9 and earlier may require
 *     Exceptions Have Stacktrace to be enabled in opera:config)
 *   - Safari 3+ (only 4+ tested)
 *   - Chrome 1+ (only 5+ tested)
 *   - Konqueror 3.5+ (untested)
 *
 * Requires TraceKit.computeStackTrace.
 *
 * Tries to catch all unhandled exceptions and report them to the
 * subscribed handlers. Please note that TraceKit.report will rethrow the
 * exception. This is REQUIRED in order to get a useful stack trace in IE.
 * If the exception does not reach the top of the browser, you will only
 * get a stack trace from the point where TraceKit.report was called.
 *
 * Handlers receive a stackInfo object as described in the
 * TraceKit.computeStackTrace docs.
 */
TraceKit.report = (function reportModuleWrapper() {
    var handlers = [],
        lastException = null,
        lastExceptionStack = null;

    /**
     * Add a crash handler.
     * @param {Function} handler
     */
    function subscribe(handler) {
        installGlobalHandler();
        handlers.push(handler);
    }

    /**
     * Remove a crash handler.
     * @param {Function} handler
     */
    function unsubscribe(handler) {
        for (var i = handlers.length - 1; i >= 0; --i) {
            if (handlers[i] === handler) {
                handlers.splice(i, 1);
            }
        }
    }

    /**
     * Dispatch stack information to all handlers.
     * @param {Object.<string, *>} stack
     */
    function notifyHandlers(stack, windowError) {
        var exception = null;
        if (windowError && !TraceKit.collectWindowErrors) {
          return;
        }
        for (var i in handlers) {
            if (_has(handlers, i)) {
                try {
                    handlers[i].apply(null, [stack].concat(_slice.call(arguments, 2)));
                } catch (inner) {
                    exception = inner;
                }
            }
        }

        if (exception) {
            throw exception;
        }
    }

    var _oldOnerrorHandler, _onErrorHandlerInstalled;

    /**
     * Ensures all global unhandled exceptions are recorded.
     * Supported by Gecko and IE.
     * @param {string} message Error message.
     * @param {string} url URL of script that generated the exception.
     * @param {(number|string)} lineNo The line number at which the error
     * occurred.
     */
    function traceKitWindowOnError(message, url, lineNo, columnNo, errorObj) {
        var stack = null;

        if (errorObj) {
          stack = TraceKit.computeStackTrace(errorObj);
        }
        else
        {
            if (lastExceptionStack) {
                TraceKit.computeStackTrace.augmentStackTraceWithInitialElement(lastExceptionStack, url, lineNo, message);
                stack = lastExceptionStack;
                lastExceptionStack = null;
                lastException = null;
            } else {
                var location = {
                    'url': url,
                    'line': lineNo,
                    'column': columnNo
                };
                location.func = TraceKit.computeStackTrace.guessFunctionName(location.url, location.line);
                location.context = TraceKit.computeStackTrace.gatherContext(location.url, location.line);
                stack = {
                    'mode': 'onerror',
                    'message': message,
                    'url': document.location.href,
                    'stack': [location],
                    'useragent': navigator.userAgent
                };
            }
        }

        notifyHandlers(stack, 'from window.onerror');

        if (_oldOnerrorHandler) {
            return _oldOnerrorHandler.apply(this, arguments);
        }

        return false;
    }

    function installGlobalHandler ()
    {
        if (_onErrorHandlerInstalled === true) {
           return;
        }
        _oldOnerrorHandler = window.onerror;
        window.onerror = traceKitWindowOnError;
        _onErrorHandlerInstalled = true;
    }

    /**
     * Reports an unhandled Error to TraceKit.
     * @param {Error} ex
     */
    function report(ex) {
        var args = _slice.call(arguments, 1);
        if (lastExceptionStack) {
            if (lastException === ex) {
                return; // already caught by an inner catch block, ignore
            } else {
                var s = lastExceptionStack;
                lastExceptionStack = null;
                lastException = null;
                notifyHandlers.apply(null, [s, null].concat(args));
            }
        }

        var stack = TraceKit.computeStackTrace(ex);
        lastExceptionStack = stack;
        lastException = ex;

        // If the stack trace is incomplete, wait for 2 seconds for
        // slow slow IE to see if onerror occurs or not before reporting
        // this exception; otherwise, we will end up with an incomplete
        // stack trace
        window.setTimeout(function () {
            if (lastException === ex) {
                lastExceptionStack = null;
                lastException = null;
                notifyHandlers.apply(null, [stack, null].concat(args));
            }
        }, (stack.incomplete ? 2000 : 0));

        throw ex; // re-throw to propagate to the top level (and cause window.onerror)
    }

    report.subscribe = subscribe;
    report.unsubscribe = unsubscribe;
    return report;
}());

/**
 * TraceKit.computeStackTrace: cross-browser stack traces in JavaScript
 *
 * Syntax:
 *   s = TraceKit.computeStackTrace.ofCaller([depth])
 *   s = TraceKit.computeStackTrace(exception) // consider using TraceKit.report instead (see below)
 * Returns:
 *   s.name              - exception name
 *   s.message           - exception message
 *   s.stack[i].url      - JavaScript or HTML file URL
 *   s.stack[i].func     - function name, or empty for anonymous functions (if guessing did not work)
 *   s.stack[i].args     - arguments passed to the function, if known
 *   s.stack[i].line     - line number, if known
 *   s.stack[i].column   - column number, if known
 *   s.stack[i].context  - an array of source code lines; the middle element corresponds to the correct line#
 *   s.mode              - 'stack', 'stacktrace', 'multiline', 'callers', 'onerror', or 'failed' -- method used to collect the stack trace
 *
 * Supports:
 *   - Firefox:  full stack trace with line numbers and unreliable column
 *               number on top frame
 *   - Opera 10: full stack trace with line and column numbers
 *   - Opera 9-: full stack trace with line numbers
 *   - Chrome:   full stack trace with line and column numbers
 *   - Safari:   line and column number for the topmost stacktrace element
 *               only
 *   - IE:       no line numbers whatsoever
 *
 * Tries to guess names of anonymous functions by looking for assignments
 * in the source code. In IE and Safari, we have to guess source file names
 * by searching for function bodies inside all page scripts. This will not
 * work for scripts that are loaded cross-domain.
 * Here be dragons: some function names may be guessed incorrectly, and
 * duplicate functions may be mismatched.
 *
 * TraceKit.computeStackTrace should only be used for tracing purposes.
 * Logging of unhandled exceptions should be done with TraceKit.report,
 * which builds on top of TraceKit.computeStackTrace and provides better
 * IE support by utilizing the window.onerror event to retrieve information
 * about the top of the stack.
 *
 * Note: In IE and Safari, no stack trace is recorded on the Error object,
 * so computeStackTrace instead walks its *own* chain of callers.
 * This means that:
 *  * in Safari, some methods may be missing from the stack trace;
 *  * in IE, the topmost function in the stack trace will always be the
 *    caller of computeStackTrace.
 *
 * This is okay for tracing (because you are likely to be calling
 * computeStackTrace from the function you want to be the topmost element
 * of the stack trace anyway), but not okay for logging unhandled
 * exceptions (because your catch block will likely be far away from the
 * inner function that actually caused the exception).
 *
 * Tracing example:
 *     function trace(message) {
 *         var stackInfo = TraceKit.computeStackTrace.ofCaller();
 *         var data = message + "\n";
 *         for(var i in stackInfo.stack) {
 *             var item = stackInfo.stack[i];
 *             data += (item.func || '[anonymous]') + "() in " + item.url + ":" + (item.line || '0') + "\n";
 *         }
 *         if (window.console)
 *             console.info(data);
 *         else
 *             alert(data);
 *     }
 */
TraceKit.computeStackTrace = (function computeStackTraceWrapper() {
    var debug = false,
        sourceCache = {};

    /**
     * Attempts to retrieve source code via XMLHttpRequest, which is used
     * to look up anonymous function names.
     * @param {string} url URL of source code.
     * @return {string} Source contents.
     */
    function loadSource(url) {
        if (typeof url !== 'string') {
          return [];
        }

        if (!TraceKit.remoteFetching) { //Only attempt request if remoteFetching is on.
            return '';
        }
        try {
            var getXHR = function() {
                try {
                    return new window.XMLHttpRequest();
                } catch (e) {
                    // explicitly bubble up the exception if not found
                    return new window.ActiveXObject('Microsoft.XMLHTTP');
                }
            };

            var request = getXHR();
            request.open('GET', url, false);
            request.send('');
            return request.responseText;
        } catch (e) {
            return '';
        }
    }

    /**
     * Retrieves source code from the source code cache.
     * @param {string} url URL of source code.
     * @return {Array.<string>} Source contents.
     */
    function getSource(url) {
        if (!_has(sourceCache, url)) {
            // URL needs to be able to fetched within the acceptable domain.  Otherwise,
            // cross-domain errors will be triggered.
            var source = '';

            url = url || "";

            if (url.indexOf && url.indexOf(document.domain) !== -1) {
                source = loadSource(url);
            }
            sourceCache[url] = source ? source.split('\n') : [];
        }

        return sourceCache[url];
    }

    /**
     * Tries to use an externally loaded copy of source code to determine
     * the name of a function by looking at the name of the variable it was
     * assigned to, if any.
     * @param {string} url URL of source code.
     * @param {(string|number)} lineNo Line number in source code.
     * @return {string} The function name, if discoverable.
     */
    function guessFunctionName(url, lineNo) {
        var reFunctionArgNames = /function ([^(]*)\(([^)]*)\)/,
            reGuessFunction = /['"]?([0-9A-Za-z$_]+)['"]?\s*[:=]\s*(function|eval|new Function)/,
            line = '',
            maxLines = 10,
            source = getSource(url),
            m;

        if (!source.length) {
            return UNKNOWN_FUNCTION;
        }

        // Walk backwards from the first line in the function until we find the line which
        // matches the pattern above, which is the function definition
        for (var i = 0; i < maxLines; ++i) {
            line = source[lineNo - i] + line;

            if (!_isUndefined(line)) {
                if ((m = reGuessFunction.exec(line))) {
                    return m[1];
                } else if ((m = reFunctionArgNames.exec(line))) {
                    return m[1];
                }
            }
        }

        return UNKNOWN_FUNCTION;
    }

    /**
     * Retrieves the surrounding lines from where an exception occurred.
     * @param {string} url URL of source code.
     * @param {(string|number)} line Line number in source code to centre
     * around for context.
     * @return {?Array.<string>} Lines of source code.
     */
    function gatherContext(url, line) {
        var source = getSource(url);

        if (!source.length) {
            return null;
        }

        var context = [],
            // linesBefore & linesAfter are inclusive with the offending line.
            // if linesOfContext is even, there will be one extra line
            //   *before* the offending line.
            linesBefore = Math.floor(TraceKit.linesOfContext / 2),
            // Add one extra line if linesOfContext is odd
            linesAfter = linesBefore + (TraceKit.linesOfContext % 2),
            start = Math.max(0, line - linesBefore - 1),
            end = Math.min(source.length, line + linesAfter - 1);

        line -= 1; // convert to 0-based index

        for (var i = start; i < end; ++i) {
            if (!_isUndefined(source[i])) {
                context.push(source[i]);
            }
        }

        return context.length > 0 ? context : null;
    }

    /**
     * Escapes special characters, except for whitespace, in a string to be
     * used inside a regular expression as a string literal.
     * @param {string} text The string.
     * @return {string} The escaped string literal.
     */
    function escapeRegExp(text) {
        return text.replace(/[\-\[\]{}()*+?.,\\\^$|#]/g, '\\$&');
    }

    /**
     * Escapes special characters in a string to be used inside a regular
     * expression as a string literal. Also ensures that HTML entities will
     * be matched the same as their literal friends.
     * @param {string} body The string.
     * @return {string} The escaped string.
     */
    function escapeCodeAsRegExpForMatchingInsideHTML(body) {
        return escapeRegExp(body).replace('<', '(?:<|&lt;)').replace('>', '(?:>|&gt;)').replace('&', '(?:&|&amp;)').replace('"', '(?:"|&quot;)').replace(/\s+/g, '\\s+');
    }

    /**
     * Determines where a code fragment occurs in the source code.
     * @param {RegExp} re The function definition.
     * @param {Array.<string>} urls A list of URLs to search.
     * @return {?Object.<string, (string|number)>} An object containing
     * the url, line, and column number of the defined function.
     */
    function findSourceInUrls(re, urls) {
        var source, m;
        for (var i = 0, j = urls.length; i < j; ++i) {
            // console.log('searching', urls[i]);
            if ((source = getSource(urls[i])).length) {
                source = source.join('\n');
                if ((m = re.exec(source))) {
                    // console.log('Found function in ' + urls[i]);

                    return {
                        'url': urls[i],
                        'line': source.substring(0, m.index).split('\n').length,
                        'column': m.index - source.lastIndexOf('\n', m.index) - 1
                    };
                }
            }
        }

        // console.log('no match');

        return null;
    }

    /**
     * Determines at which column a code fragment occurs on a line of the
     * source code.
     * @param {string} fragment The code fragment.
     * @param {string} url The URL to search.
     * @param {(string|number)} line The line number to examine.
     * @return {?number} The column number.
     */
    function findSourceInLine(fragment, url, line) {
        var source = getSource(url),
            re = new RegExp('\\b' + escapeRegExp(fragment) + '\\b'),
            m;

        line -= 1;

        if (source && source.length > line && (m = re.exec(source[line]))) {
            return m.index;
        }

        return null;
    }

    /**
     * Determines where a function was defined within the source code.
     * @param {(Function|string)} func A function reference or serialized
     * function definition.
     * @return {?Object.<string, (string|number)>} An object containing
     * the url, line, and column number of the defined function.
     */
    function findSourceByFunctionBody(func) {
        var urls = [window.location.href],
            scripts = document.getElementsByTagName('script'),
            body,
            code = '' + func,
            codeRE = /^function(?:\s+([\w$]+))?\s*\(([\w\s,]*)\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/,
            eventRE = /^function on([\w$]+)\s*\(event\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/,
            re,
            parts,
            result;

        for (var i = 0; i < scripts.length; ++i) {
            var script = scripts[i];
            if (script.src) {
                urls.push(script.src);
            }
        }

        if (!(parts = codeRE.exec(code))) {
            re = new RegExp(escapeRegExp(code).replace(/\s+/g, '\\s+'));
        }

        // not sure if this is really necessary, but I don’t have a test
        // corpus large enough to confirm that and it was in the original.
        else {
            var name = parts[1] ? '\\s+' + parts[1] : '',
                args = parts[2].split(',').join('\\s*,\\s*');

            body = escapeRegExp(parts[3]).replace(/;$/, ';?'); // semicolon is inserted if the function ends with a comment.replace(/\s+/g, '\\s+');
            re = new RegExp('function' + name + '\\s*\\(\\s*' + args + '\\s*\\)\\s*{\\s*' + body + '\\s*}');
        }

        // look for a normal function definition
        if ((result = findSourceInUrls(re, urls))) {
            return result;
        }

        // look for an old-school event handler function
        if ((parts = eventRE.exec(code))) {
            var event = parts[1];
            body = escapeCodeAsRegExpForMatchingInsideHTML(parts[2]);

            // look for a function defined in HTML as an onXXX handler
            re = new RegExp('on' + event + '=[\\\'"]\\s*' + body + '\\s*[\\\'"]', 'i');

            if ((result = findSourceInUrls(re, urls[0]))) {
                return result;
            }

            // look for ???
            re = new RegExp(body);

            if ((result = findSourceInUrls(re, urls))) {
                return result;
            }
        }

        return null;
    }

    // Contents of Exception in various browsers.
    //
    // SAFARI:
    // ex.message = Can't find variable: qq
    // ex.line = 59
    // ex.sourceId = 580238192
    // ex.sourceURL = http://...
    // ex.expressionBeginOffset = 96
    // ex.expressionCaretOffset = 98
    // ex.expressionEndOffset = 98
    // ex.name = ReferenceError
    //
    // FIREFOX:
    // ex.message = qq is not defined
    // ex.fileName = http://...
    // ex.lineNumber = 59
    // ex.stack = ...stack trace... (see the example below)
    // ex.name = ReferenceError
    //
    // CHROME:
    // ex.message = qq is not defined
    // ex.name = ReferenceError
    // ex.type = not_defined
    // ex.arguments = ['aa']
    // ex.stack = ...stack trace...
    //
    // INTERNET EXPLORER:
    // ex.message = ...
    // ex.name = ReferenceError
    //
    // OPERA:
    // ex.message = ...message... (see the example below)
    // ex.name = ReferenceError
    // ex.opera#sourceloc = 11  (pretty much useless, duplicates the info in ex.message)
    // ex.stacktrace = n/a; see 'opera:config#UserPrefs|Exceptions Have Stacktrace'

    /**
     * Computes stack trace information from the stack property.
     * Chrome and Gecko use this property.
     * Added WinJS regex for Raygun4JS's offline caching support
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceFromStackProp(ex) {
        if (!ex.stack) {
            return null;
        }

        var chrome = /^\s*at (.*?) ?\(?((?:file|http|https|chrome-extension):.*?):(\d+)(?::(\d+))?\)?\s*$/i,
            gecko = /^\s*(.*?)(?:\((.*?)\))?@?((?:file|http|https|chrome):.*?):(\d+)(?::(\d+))?\s*$/i,
            winjs = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:ms-appx|http|https):.*?):(\d+)(?::(\d+))?\)?\s*$/i,
            lines = ex.stack.split('\n'),
            stack = [],
            parts,
            element,
            reference = /^(.*) is undefined$/.exec(ex.message);

        for (var i = 0, j = lines.length; i < j; ++i) {
            if ((parts = gecko.exec(lines[i]))) {
                element = {
                    'url': parts[3],
                    'func': parts[1] || UNKNOWN_FUNCTION,
                    'args': parts[2] ? parts[2].split(',') : '',
                    'line': +parts[4],
                    'column': parts[5] ? +parts[5] : null
                };
            } else if ((parts = chrome.exec(lines[i]))) {
                element = {
                    'url': parts[2],
                    'func': parts[1] || UNKNOWN_FUNCTION,
                    'line': +parts[3],
                    'column': parts[4] ? +parts[4] : null
                };
            } else if ((parts = winjs.exec(lines[i]))) {
              element = {
                'url': parts[2],
                'func': parts[1] || UNKNOWN_FUNCTION,
                'line': +parts[3],
                'column': parts[4] ? +parts[4] : null
              };
            } else {
                continue;
            }

            if (!element.func && element.line) {
                element.func = guessFunctionName(element.url, element.line);
            }

            if (element.line) {
                element.context = gatherContext(element.url, element.line);
            }

            stack.push(element);
        }

        if (stack[0] && stack[0].line && !stack[0].column && reference) {
            stack[0].column = findSourceInLine(reference[1], stack[0].url, stack[0].line);
        } else if (!stack[0].column && typeof ex.columnNumber !== 'undefined') {
            // Firefox column number
            stack[0].column = ex.columnNumber + 1;
        }

        if (!stack.length) {
            return null;
        }

        return {
            'mode': 'stack',
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
    }

    /**
     * Computes stack trace information from the stacktrace property.
     * Opera 10 uses this property.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceFromStacktraceProp(ex) {
        // Access and store the stacktrace property before doing ANYTHING
        // else to it because Opera is not very good at providing it
        // reliably in other circumstances.
        var stacktrace = ex.stacktrace;

        var testRE = / line (\d+), column (\d+) in (?:<anonymous function: ([^>]+)>|([^\)]+))\((.*)\) in (.*):\s*$/i,
            lines = stacktrace !== null ? stacktrace.split('\n') : stacktrace,
            stack = [],
            parts;

        for (var i = 0, j = lines.length; i < j; i += 2) {
            if ((parts = testRE.exec(lines[i]))) {
                var element = {
                    'line': +parts[1],
                    'column': +parts[2],
                    'func': parts[3] || parts[4],
                    'args': parts[5] ? parts[5].split(',') : [],
                    'url': parts[6]
                };

                if (!element.func && element.line) {
                    element.func = guessFunctionName(element.url, element.line);
                }
                if (element.line) {
                    try {
                        element.context = gatherContext(element.url, element.line);
                    } catch (exc) {}
                }

                if (!element.context) {
                    element.context = [lines[i + 1]];
                }

                stack.push(element);
            }
        }

        if (!stack.length) {
            return null;
        }

        return {
            'mode': 'stacktrace',
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
    }

    /**
     * NOT TESTED.
     * Computes stack trace information from an error message that includes
     * the stack trace.
     * Opera 9 and earlier use this method if the option to show stack
     * traces is turned on in opera:config.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack information.
     */
    function computeStackTraceFromOperaMultiLineMessage(ex) {
        // Opera includes a stack trace into the exception message. An example is:
        //
        // Statement on line 3: Undefined variable: undefinedFunc
        // Backtrace:
        //   Line 3 of linked script file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.js: In function zzz
        //         undefinedFunc(a);
        //   Line 7 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function yyy
        //           zzz(x, y, z);
        //   Line 3 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function xxx
        //           yyy(a, a, a);
        //   Line 1 of function script
        //     try { xxx('hi'); return false; } catch(ex) { TraceKit.report(ex); }
        //   ...

        var lines = ex.message.split('\n');
        if (lines.length < 4) {
            return null;
        }

        var lineRE1 = /^\s*Line (\d+) of linked script ((?:file|http|https)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE2 = /^\s*Line (\d+) of inline#(\d+) script in ((?:file|http|https)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE3 = /^\s*Line (\d+) of function script\s*$/i,
            stack = [],
            scripts = document.getElementsByTagName('script'),
            inlineScriptBlocks = [],
            parts,
            i,
            len,
            source;

        for (i in scripts) {
            if (_has(scripts, i) && !scripts[i].src) {
                inlineScriptBlocks.push(scripts[i]);
            }
        }

        for (i = 2, len = lines.length; i < len; i += 2) {
            var item = null;
            if ((parts = lineRE1.exec(lines[i]))) {
                item = {
                    'url': parts[2],
                    'func': parts[3],
                    'line': +parts[1]
                };
            } else if ((parts = lineRE2.exec(lines[i]))) {
                item = {
                    'url': parts[3],
                    'func': parts[4]
                };
                var relativeLine = (+parts[1]); // relative to the start of the <SCRIPT> block
                var script = inlineScriptBlocks[parts[2] - 1];
                if (script) {
                    source = getSource(item.url);
                    if (source) {
                        source = source.join('\n');
                        var pos = source.indexOf(script.innerText);
                        if (pos >= 0) {
                            item.line = relativeLine + source.substring(0, pos).split('\n').length;
                        }
                    }
                }
            } else if ((parts = lineRE3.exec(lines[i]))) {
                var url = window.location.href.replace(/#.*$/, ''),
                    line = parts[1];
                var re = new RegExp(escapeCodeAsRegExpForMatchingInsideHTML(lines[i + 1]));
                source = findSourceInUrls(re, [url]);
                item = {
                    'url': url,
                    'line': source ? source.line : line,
                    'func': ''
                };
            }

            if (item) {
                if (!item.func) {
                    item.func = guessFunctionName(item.url, item.line);
                }
                var context = gatherContext(item.url, item.line);
                var midline = (context ? context[Math.floor(context.length / 2)] : null);
                if (context && midline.replace(/^\s*/, '') === lines[i + 1].replace(/^\s*/, '')) {
                    item.context = context;
                } else {
                    // if (context) alert("Context mismatch. Correct midline:\n" + lines[i+1] + "\n\nMidline:\n" + midline + "\n\nContext:\n" + context.join("\n") + "\n\nURL:\n" + item.url);
                    item.context = [lines[i + 1]];
                }
                stack.push(item);
            }
        }
        if (!stack.length) {
            return null; // could not parse multiline exception message as Opera stack trace
        }

        return {
            'mode': 'multiline',
            'name': ex.name,
            'message': lines[0],
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
    }

    /**
     * Adds information about the first frame to incomplete stack traces.
     * Safari and IE require this to get complete data on the first frame.
     * @param {Object.<string, *>} stackInfo Stack trace information from
     * one of the compute* methods.
     * @param {string} url The URL of the script that caused an error.
     * @param {(number|string)} lineNo The line number of the script that
     * caused an error.
     * @param {string=} message The error generated by the browser, which
     * hopefully contains the name of the object that caused the error.
     * @return {boolean} Whether or not the stack information was
     * augmented.
     */
    function augmentStackTraceWithInitialElement(stackInfo, url, lineNo, message) {
        var initial = {
            'url': url,
            'line': lineNo
        };

        if (initial.url && initial.line) {
            stackInfo.incomplete = false;

            if (!initial.func) {
                initial.func = guessFunctionName(initial.url, initial.line);
            }

            if (!initial.context) {
                initial.context = gatherContext(initial.url, initial.line);
            }

            var reference = / '([^']+)' /.exec(message);
            if (reference) {
                initial.column = findSourceInLine(reference[1], initial.url, initial.line);
            }

            if (stackInfo.stack.length > 0) {
                if (stackInfo.stack[0].url === initial.url) {
                    if (stackInfo.stack[0].line === initial.line) {
                        return false; // already in stack trace
                    } else if (!stackInfo.stack[0].line && stackInfo.stack[0].func === initial.func) {
                        stackInfo.stack[0].line = initial.line;
                        stackInfo.stack[0].context = initial.context;
                        return false;
                    }
                }
            }

            stackInfo.stack.unshift(initial);
            stackInfo.partial = true;
            return true;
        } else {
            stackInfo.incomplete = true;
        }

        return false;
    }

    /**
     * Computes stack trace information by walking the arguments.caller
     * chain at the time the exception occurred. This will cause earlier
     * frames to be missed but is the only way to get any stack trace in
     * Safari and IE. The top frame is restored by
     * {@link augmentStackTraceWithInitialElement}.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceByWalkingCallerChain(ex, depth) {
        var functionName = /function\s+([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*)?\s*\(/i,
            stack = [],
            funcs = {},
            recursion = false,
            parts,
            item,
            source;

        for (var curr = computeStackTraceByWalkingCallerChain.caller; curr && !recursion; curr = curr.caller) {
            if (curr === computeStackTrace || curr === TraceKit.report) {
                // console.log('skipping internal function');
                continue;
            }

            item = {
                'url': null,
                'func': UNKNOWN_FUNCTION,
                'line': null,
                'column': null
            };

            if (curr.name) {
                item.func = curr.name;
            } else if ((parts = functionName.exec(curr.toString()))) {
                item.func = parts[1];
            }

            if (typeof item.func === 'undefined') {
              try {
                item.func = parts.input.substring(0, parts.input.indexOf('{'))
              } catch (e) { }
            }

            if ((source = findSourceByFunctionBody(curr))) {
                item.url = source.url;
                item.line = source.line;

                if (item.func === UNKNOWN_FUNCTION) {
                    item.func = guessFunctionName(item.url, item.line);
                }

                var reference = / '([^']+)' /.exec(ex.message || ex.description);
                if (reference) {
                    item.column = findSourceInLine(reference[1], source.url, source.line);
                }
            }

            if (funcs['' + curr]) {
                recursion = true;
            }else{
                funcs['' + curr] = true;
            }

            stack.push(item);
        }

        if (depth) {
            // console.log('depth is ' + depth);
            // console.log('stack is ' + stack.length);
            stack.splice(0, depth);
        }

        var result = {
            'mode': 'callers',
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
        augmentStackTraceWithInitialElement(result, ex.sourceURL || ex.fileName, ex.line || ex.lineNumber, ex.message || ex.description);
        return result;
    }

    /**
     * Computes a stack trace for an exception.
     * @param {Error} ex
     * @param {(string|number)=} depth
     */
    function computeStackTrace(ex, depth) {
        var stack = null;
        depth = (depth == null ? 0 : +depth);

        try {
            // This must be tried first because Opera 10 *destroys*
            // its stacktrace property if you try to access the stack
            // property first!!
            stack = computeStackTraceFromStacktraceProp(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceFromStackProp(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceFromOperaMultiLineMessage(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceByWalkingCallerChain(ex, depth + 1);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        return {
            'mode': 'failed'
        };
    }

    /**
     * Logs a stacktrace starting from the previous call and working down.
     * @param {(number|string)=} depth How many frames deep to trace.
     * @return {Object.<string, *>} Stack trace information.
     */
    function computeStackTraceOfCaller(depth) {
        depth = (depth == null ? 0 : +depth) + 1; // "+ 1" because "ofCaller" should drop one frame
        try {
            throw new Error();
        } catch (ex) {
            return computeStackTrace(ex, depth + 1);
        }
    }

    computeStackTrace.augmentStackTraceWithInitialElement = augmentStackTraceWithInitialElement;
    computeStackTrace.guessFunctionName = guessFunctionName;
    computeStackTrace.gatherContext = gatherContext;
    computeStackTrace.ofCaller = computeStackTraceOfCaller;

    return computeStackTrace;
}());

/**
 * Extends support for global error handling for asynchronous browser
 * functions. Adopted from Closure Library's errorhandler.js
 */
TraceKit.extendToAsynchronousCallbacks = function () {
    var _helper = function _helper(fnName) {
        var originalFn = window[fnName];
        window[fnName] = function traceKitAsyncExtension() {
            // Make a copy of the arguments
            var args = _slice.call(arguments);
            var originalCallback = args[0];
            if (typeof (originalCallback) === 'function') {
                args[0] = TraceKit.wrap(originalCallback);
            }
            // IE < 9 doesn't support .call/.apply on setInterval/setTimeout, but it
            // also only supports 2 argument and doesn't care what "this" is, so we
            // can just call the original function directly.
            if (originalFn.apply) {
                return originalFn.apply(this, args);
            } else {
                return originalFn(args[0], args[1]);
            }
        };
    };

    _helper('setTimeout');
    _helper('setInterval');
};

//Default options:
if (!TraceKit.remoteFetching) {
  TraceKit.remoteFetching = true;
}
if (!TraceKit.collectWindowErrors) {
  TraceKit.collectWindowErrors = true;
}
if (!TraceKit.linesOfContext || TraceKit.linesOfContext < 1) {
  // 5 lines before, the offending line, 5 lines after
  TraceKit.linesOfContext = 11;
}



// Export to global object
window.TraceKit = TraceKit;

}(window));

(function traceKitAsyncForjQuery($, TraceKit) {
  'use strict';
  // quit if jQuery isn't on the page
  if (!$ || !$.event || !$.event.add) {
    return;
  }

  var _oldEventAdd = $.event.add;
  $.event.add = function traceKitEventAdd(elem, types, handler, data, selector) {
    if (typeof handler !== 'function' && typeof handler.handler !== 'function') {
      _oldEventAdd.call(this, elem, types, handler, data, selector);
    }

    var _handler;

    if (handler.handler) {
      _handler = handler.handler;
      handler.handler = TraceKit.wrap(handler.handler);
    } else {
      _handler = handler;
      handler = TraceKit.wrap(handler);
    }

    // If the handler we are attaching doesn’t have the same guid as
    // the original, it will never be removed when someone tries to
    // unbind the original function later. Technically as a result of
    // this our guids are no longer globally unique, but whatever, that
    // never hurt anybody RIGHT?!
    if (_handler.guid) {
      handler.guid = _handler.guid;
    } else {
      handler.guid = _handler.guid = $.guid++;
    }

    return _oldEventAdd.call(this, elem, types, handler, data, selector);
  };

  var _oldReady = $.fn.ready;
  $.fn.ready = function traceKitjQueryReadyWrapper(fn) {
    return _oldReady.call(this, TraceKit.wrap(fn));
  };

  var _oldAjax = $.ajax;
  $.ajax = function traceKitAjaxWrapper(url, options) {
    if (typeof url === "object") {
      options = url;
      url = undefined;
    }

    options = options || {};

    var keys = ['complete', 'error', 'success'], key;
    while(key = keys.pop()) {
      if ($.isFunction(options[key])) {
        options[key] = TraceKit.wrap(options[key]);
      }
    }

    try {
      return (url) ? _oldAjax.call(this, url, options) : _oldAjax.call(this, options);
    } catch (e) {
      TraceKit.report(e);
      throw e;
    }
  };

}(window.jQuery, window.TraceKit));

var raygunFactory = function (window, $, undefined) {
    // pull local copy of TraceKit to handle stack trace collection
    var _traceKit = TraceKit,
        _raygun = window.Raygun,
        _raygunApiKey,
        _debugMode = false,
        _allowInsecureSubmissions = false,
        _ignoreAjaxAbort = false,
        _ignoreAjaxError = false,
        _enableOfflineSave = false,
        _ignore3rdPartyErrors = false,
        _disableAnonymousUserTracking = false,
        _disableErrorTracking = false,
        _disablePulse = true,
        _wrapAsynchronousCallbacks = false,
        _customData = {},
        _tags = [],
        _user,
        _version,
        _filteredKeys,
        _whitelistedScriptDomains = [],
        _beforeSendCallback,
        _groupingKeyCallback,
        _raygunApiUrl = 'https://api.raygun.io',
        _excludedHostnames = null,
        _excludedUserAgents = null,
        _filterScope = 'customData',
        _rum = null,
        _pulseMaxVirtualPageDuration = null,
        $document;


    var Raygun =
    {
        noConflict: function () {
            window.Raygun = _raygun;
            return Raygun;
        },

        constructNewRaygun: function () {
            var rgInstance = window.raygunFactory(window, window.jQuery);
            window.raygunJsUrlFactory(window, rgInstance);

            return rgInstance;
        },

        init: function (key, options, customdata) {
            _raygunApiKey = key;
            _traceKit.remoteFetching = false;

            if (customdata) {
                _customData = customdata;
            }

            if ($) {
                $document = $(document);
            }

            if (options) {
                _allowInsecureSubmissions = options.allowInsecureSubmissions || false;
                _ignoreAjaxAbort = options.ignoreAjaxAbort || false;
                _ignoreAjaxError = options.ignoreAjaxError || false;
                _disableAnonymousUserTracking = options.disableAnonymousUserTracking || false;
                _disableErrorTracking = options.disableErrorTracking || false;
                _disablePulse = options.disablePulse === undefined ? true : options.disablePulse;
                _excludedHostnames = options.excludedHostnames || false;
                _excludedUserAgents = options.excludedUserAgents || false;
                _pulseMaxVirtualPageDuration = options.pulseMaxVirtualPageDuration || null;

                if (options.apiUrl) {
                    _raygunApiUrl = options.apiUrl;
                }

                if (typeof options.wrapAsynchronousCallbacks !== 'undefined') {
                    _wrapAsynchronousCallbacks = options.wrapAsynchronousCallbacks;
                }

                if (options.debugMode) {
                    _debugMode = options.debugMode;
                }

                if (options.ignore3rdPartyErrors) {
                    _ignore3rdPartyErrors = true;
                }

                if (options.apiEndpoint) {
                    _raygunApiUrl = options.apiEndpoint;
                }
            }

            ensureUser();

            if (Raygun.RealUserMonitoring !== undefined && !_disablePulse) {
                var startRum = function () {
                    _rum = new Raygun.RealUserMonitoring(_raygunApiKey, _raygunApiUrl, makePostCorsRequest, _user, _version, _excludedHostnames, _excludedUserAgents, _debugMode, _pulseMaxVirtualPageDuration);
                    _rum.attach();
                };

                if (options && options.from === 'onLoad') {
                    startRum();
                } else {
                    if (window.addEventListener) {
                        window.addEventListener('load', startRum);
                    } else {
                        window.attachEvent('onload', startRum);
                    }
                }
            }

            sendSavedErrors();

            return Raygun;
        },

        withCustomData: function (customdata) {
            _customData = customdata;
            return Raygun;
        },

        withTags: function (tags) {
            _tags = tags;
            return Raygun;
        },

        attach: function () {
            if (!isApiKeyConfigured() || _disableErrorTracking) {
                return Raygun;
            }

            if (window.RaygunObject && window[window.RaygunObject] && window[window.RaygunObject].q) {
                window.onerror = null;
            }

            _traceKit.report.subscribe(processUnhandledException);

            if (_wrapAsynchronousCallbacks) {
                _traceKit.extendToAsynchronousCallbacks();
            }

            if ($document && $document.ajaxError && !_ignoreAjaxError) {
                $document.ajaxError(processJQueryAjaxError);
            }
            return Raygun;
        },

        detach: function () {
            _traceKit.report.unsubscribe(processUnhandledException);
            if ($document) {
                $document.unbind('ajaxError', processJQueryAjaxError);
            }
            return Raygun;
        },

        send: function (ex, customData, tags) {
            if (_disableErrorTracking) {
                _private.log('Error not sent due to disabled error tracking');
                return Raygun;
            }

            try {
                processUnhandledException(_traceKit.computeStackTrace(ex), {
                    customData: typeof _customData === 'function' ?
                        merge(_customData(), customData) :
                        merge(_customData, customData),
                    tags: mergeArray(_tags, tags)
                });
            }
            catch (traceKitException) {
                if (ex !== traceKitException) {
                    throw traceKitException;
                }
            }
            return Raygun;
        },

        setUser: function (user, isAnonymous, email, fullName, firstName, uuid) {
            _user = {
                'Identifier': user
            };
            if (typeof isAnonymous === 'boolean') {
                _user['IsAnonymous'] = isAnonymous;
            }
            if (email) {
                _user['Email'] = email;
            }
            if (fullName) {
                _user['FullName'] = fullName;
            }
            if (firstName) {
                _user['FirstName'] = firstName;
            }
            if (uuid) {
                _user['UUID'] = uuid;
            }

            if (_rum !== undefined && _rum !== null) {
                _rum.setUser(_user);
            }

            return Raygun;
        },

        resetAnonymousUser: function () {
            _private.clearCookie('raygun4js-userid');
        },

        setVersion: function (version) {
            _version = version;
            return Raygun;
        },

        saveIfOffline: function (enableOffline) {
            if (typeof enableOffline !== 'undefined' && typeof enableOffline === 'boolean') {
                _enableOfflineSave = enableOffline;
            }

            return Raygun;
        },

        filterSensitiveData: function (filteredKeys) {
            _filteredKeys = filteredKeys;
            return Raygun;
        },

        setFilterScope: function (scope) {
            if (scope === 'customData' || scope === 'all') {
                _filterScope = scope;
            }
            return Raygun;
        },

        whitelistCrossOriginDomains: function (whitelist) {
            _whitelistedScriptDomains = whitelist;
            return Raygun;
        },

        onBeforeSend: function (callback) {
            _beforeSendCallback = callback;

            return Raygun;
        },

        groupingKey: function (callback) {
            _groupingKeyCallback = callback;
            return Raygun;
        },

        // Public Pulse functions

        endSession: function () {
            if (Raygun.RealUserMonitoring !== undefined && _rum) {
                _rum.endSession();
            }
        },

        trackEvent: function (type, options) {
          if (Raygun.RealUserMonitoring  !== undefined && _rum) {
              if (type === 'pageView' && options.path) {
                _rum.virtualPageLoaded(options.path);
              }
          }
        }

    };

    var _private = Raygun._private = Raygun._private || {},
        _seal = Raygun._seal = Raygun._seal || function () {
                delete Raygun._private;
                delete Raygun._seal;
                delete Raygun._unseal;
            },
        _unseal = Raygun._unseal = Raygun._unseal || function () {
                Raygun._private = _private;
                Raygun._seal = _seal;
                Raygun._unseal = _unseal;
            };

    _private.getUuid = function () {
        function _p8(s) {
            var p = (Math.random().toString(16) + "000000000").substr(2, 8);
            return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
        }

        return _p8() + _p8(true) + _p8(true) + _p8();
    };

    _private.createCookie = function (name, value, hours) {
        var expires;
        if (hours) {
            var date = new Date();
            date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        }
        else {
            expires = "";
        }

        document.cookie = name + "=" + value + expires + "; path=/";
    };

    _private.readCookie = function (name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    };

    _private.clearCookie = function (key) {
        _private.createCookie(key, '', -1);
    };

    _private.log = function (message, data) {
        if (window.console && window.console.log && _debugMode) {
            window.console.log(message);

            if (data) {
                window.console.log(data);
            }
        }
    };

    /* internals */

    function truncateURL(url) {
        // truncate after fourth /, or 24 characters, whichever is shorter
        // /api/1/diagrams/xyz/server becomes
        // /api/1/diagrams/...
        var truncated = url;
        var path = url.split('//')[1];

        if (path) {
            var queryStart = path.indexOf('?');
            var sanitizedPath = path.toString().substring(0, queryStart);
            var truncated_parts = sanitizedPath.split('/').slice(0, 4).join('/');
            var truncated_length = sanitizedPath.substring(0, 48);
            truncated = truncated_parts.length < truncated_length.length ?
                truncated_parts : truncated_length;
            if (truncated !== sanitizedPath) {
                truncated += '..';
            }
        }

        return truncated;
    }

    function processJQueryAjaxError(event, jqXHR, ajaxSettings, thrownError) {
        var message = 'AJAX Error: ' +
            (jqXHR.statusText || 'unknown') + ' ' +
            (ajaxSettings.type || 'unknown') + ' ' +
            (truncateURL(ajaxSettings.url) || 'unknown');

        // ignore ajax abort if set in the options
        if (_ignoreAjaxAbort) {
            if (!jqXHR.getAllResponseHeaders()) {
                return;
            }
        }

        Raygun.send(thrownError || event.type, {
            status: jqXHR.status,
            statusText: jqXHR.statusText,
            type: ajaxSettings.type,
            url: ajaxSettings.url,
            ajaxErrorMessage: message,
            contentType: ajaxSettings.contentType,
            requestData: ajaxSettings.data && ajaxSettings.data.slice ? ajaxSettings.data.slice(0, 10240) : undefined,
            responseData: jqXHR.responseText && jqXHR.responseText.slice ? jqXHR.responseText.slice(0, 10240) : undefined,
            activeTarget: event.target && event.target.activeElement && event.target.activeElement.outerHTML && event.target.activeElement.outerHTML.slice ? event.target.activeElement.outerHTML.slice(0, 10240) : undefined
        });
    }


    function isApiKeyConfigured() {
        if (_raygunApiKey && _raygunApiKey !== '') {
            return true;
        }
        _private.log("Raygun API key has not been configured, make sure you call Raygun.init(yourApiKey)");
        return false;
    }

    function merge(o1, o2) {
        var a, o3 = {};
        for (a in o1) {
            o3[a] = o1[a];
        }
        for (a in o2) {
            o3[a] = o2[a];
        }
        return o3;
    }

    function mergeArray(t0, t1) {
        if (t1 != null) {
            return t0.concat(t1);
        }
        return t0;
    }

    function forEach(set, func) {
        for (var i = 0; i < set.length; i++) {
            func.call(null, i, set[i]);
        }
    }

    function isEmpty(o) {
        for (var p in o) {
            if (o.hasOwnProperty(p)) {
                return false;
            }
        }
        return true;
    }

    function getRandomInt() {
        return Math.floor(Math.random() * 9007199254740993);
    }

    function getViewPort() {
        var e = document.documentElement,
            g = document.getElementsByTagName('body')[0],
            x = window.innerWidth || e.clientWidth || g.clientWidth,
            y = window.innerHeight || e.clientHeight || g.clientHeight;
        return {width: x, height: y};
    }

    function offlineSave(url, data) {
        var dateTime = new Date().toJSON();

        try {
            var key = 'raygunjs=' + dateTime + '=' + getRandomInt();

            if (typeof localStorage[key] === 'undefined') {
                localStorage[key] = JSON.stringify({url: url, data: data});
            }
        } catch (e) {
            _private.log('Raygun4JS: LocalStorage full, cannot save exception');
        }
    }

    function localStorageAvailable() {
        try {
            return ('localStorage' in window) && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }

    function sendSavedErrors() {
        if (localStorageAvailable() && localStorage && localStorage.length > 0) {
            for (var key in localStorage) {
                if (key.substring(0, 9) === 'raygunjs=') {
                    try {
                        var payload = JSON.parse(localStorage[key]);
                        makePostCorsRequest(payload.url, payload.data);
                        localStorage.removeItem(key);
                    } catch (e) {
                        _private.log('Raygun4JS: Unable to send saved error');
                    }
                }
            }
        }
    }

    function ensureUser() {
        if (!_user && !_disableAnonymousUserTracking) {
            var userKey = 'raygun4js-userid';
            var rgUserId = _private.readCookie(userKey);
            var anonymousUuid;

            if (!rgUserId) {
                anonymousUuid = _private.getUuid();

                _private.createCookie(userKey, anonymousUuid, 24 * 31);
            } else {
                anonymousUuid = rgUserId;
            }

            Raygun.setUser(anonymousUuid, true, null, null, null, anonymousUuid);
        }
    }

    function filterValue(key, value) {
        if (_filteredKeys) {
            for (var i = 0; i < _filteredKeys.length; i++) {
                if (typeof _filteredKeys[i] === 'object' && typeof _filteredKeys[i].exec === 'function') {
                    if (_filteredKeys[i].exec(key) !== null) {
                        return '[removed by filter]';
                    }
                }
                else if (_filteredKeys[i] === key) {
                    return '[removed by filter]';
                }
            }
        }

        return value;
    }

    function filterObject(reference, parentKey) {
        if (reference == null) {
            return reference;
        }

        if (Object.prototype.toString.call(reference) !== '[object Object]') {
            return reference;
        }

        var filteredObject = {};

        for (var propertyName in reference) {
            var propertyValue = reference[propertyName];

            if (propertyValue == null) {
                continue;
            }

            if (Object.prototype.toString.call(propertyValue) === '[object Object]') {
                if (parentKey !== 'Details' || propertyName !== 'Client') {
                    filteredObject[propertyName] = filterObject(filterValue(propertyName, propertyValue), propertyName);
                } else {
                    filteredObject[propertyName] = propertyValue;
                }
            } else if (Object.prototype.toString.call(propertyValue) !== '[object Function]') {
                if (typeof parentKey !== 'undefined') {
                  filteredObject[propertyName] = filterValue(propertyName, propertyValue);
                } else if (propertyName === 'OccurredOn') {
                  filteredObject[propertyName] = propertyValue;
                }
            }
        }

        return filteredObject;
    }

    function processUnhandledException(stackTrace, options) {
        var stack = [],
            qs = {};

        if (_ignore3rdPartyErrors) {
            if (!stackTrace.stack || !stackTrace.stack.length) {
                _private.log('Raygun4JS: Cancelling send due to null stacktrace');
                return;
            }

            var domain = _private.parseUrl('domain');

            var scriptError = 'Script error';
            var msg = stackTrace.message || options.status || scriptError;
            if (msg.substring(0, scriptError.length) === scriptError &&
                stackTrace.stack[0].url !== null &&
                stackTrace.stack[0].url.indexOf(domain) === -1 &&
                (stackTrace.stack[0].line === 0 || stackTrace.stack[0].func === '?')) {
                _private.log('Raygun4JS: cancelling send due to third-party script error with no stacktrace and message');
                return;
            }


            if (stackTrace.stack[0].url !== null && stackTrace.stack[0].url.indexOf(domain) === -1) {
                var allowedDomainFound = false;

                for (var i in _whitelistedScriptDomains) {
                    if (stackTrace.stack[0].url.indexOf(_whitelistedScriptDomains[i]) > -1) {
                        allowedDomainFound = true;
                    }
                }

                if (!allowedDomainFound) {
                    _private.log('Raygun4JS: cancelling send due to error on non-origin, non-whitelisted domain');

                    return;
                }
            }
        }

        if (_excludedHostnames instanceof Array) {
            for (var hostIndex in _excludedHostnames) {
                if (_excludedHostnames.hasOwnProperty(hostIndex)) {
                    if (window.location.hostname && window.location.hostname.match(_excludedHostnames[hostIndex])) {
                        _private.log('Raygun4JS: cancelling send as error originates from an excluded hostname');

                        return;
                    }
                }
            }
        }

        if (_excludedUserAgents instanceof Array) {
            for (var userAgentIndex in _excludedUserAgents) {
                if (_excludedUserAgents.hasOwnProperty(userAgentIndex)) {
                    if (navigator.userAgent.match(_excludedUserAgents[userAgentIndex])) {
                        _private.log('Raygun4JS: cancelling send as error originates from an excluded user agent');

                        return;
                    }
                }
            }
        }

        if (stackTrace.stack && stackTrace.stack.length) {
            forEach(stackTrace.stack, function (i, frame) {
                stack.push({
                    'LineNumber': frame.line,
                    'ColumnNumber': frame.column,
                    'ClassName': 'line ' + frame.line + ', column ' + frame.column,
                    'FileName': frame.url,
                    'MethodName': frame.func || '[anonymous]'
                });
            });
        }

        var queryString = _private.parseUrl('?');

        if (queryString.length > 0) {
            forEach(queryString.split('&'), function (i, segment) {
                var parts = segment.split('=');
                if (parts && parts.length === 2) {
                    var key = decodeURIComponent(parts[0]);
                    var value = filterValue(key, parts[1]);

                    qs[key] = value;
                }
            });
        }

        if (options === undefined) {
            options = {};
        }

        if (isEmpty(options.customData)) {
            if (typeof _customData === 'function') {
                options.customData = _customData();
            } else {
                options.customData = _customData;
            }
        }

        if (isEmpty(options.tags)) {
            if (typeof _tags === 'function') {
                options.tags = _tags();
            } else {
                options.tags = _tags;
            }
        }

        var screen = window.screen || {width: getViewPort().width, height: getViewPort().height, colorDepth: 8};
        var custom_message = options.customData && options.customData.ajaxErrorMessage;

        var finalCustomData;
        if (_filterScope === 'customData') {
            finalCustomData = filterObject(options.customData, 'UserCustomData');
        } else {
            finalCustomData = options.customData;
        }

        try {
            JSON.stringify(finalCustomData);
        } catch (e) {
            var msg = 'Cannot add custom data; may contain circular reference';
            finalCustomData = {error: msg};
            _private.log('Raygun4JS: ' + msg);
        }

        var finalMessage = custom_message || stackTrace.message || options.status || 'Script error';

        if (finalMessage) {
          finalMessage = finalMessage.substring(0, 512);
        }

        var payload = {
            'OccurredOn': new Date(),
            'Details': {
                'Error': {
                    'ClassName': stackTrace.name,
                    'Message': finalMessage,
                    'StackTrace': stack
                },
                'Environment': {
                    'UtcOffset': new Date().getTimezoneOffset() / -60.0,
                    'User-Language': navigator.userLanguage,
                    'Document-Mode': document.documentMode,
                    'Browser-Width': getViewPort().width,
                    'Browser-Height': getViewPort().height,
                    'Screen-Width': screen.width,
                    'Screen-Height': screen.height,
                    'Color-Depth': screen.colorDepth,
                    'Browser': navigator.appCodeName,
                    'Browser-Name': navigator.appName,
                    'Browser-Version': navigator.appVersion,
                    'Platform': navigator.platform
                },
                'Client': {
                    'Name': 'raygun-js',
                    'Version': '2.2.3'
                },
                'UserCustomData': finalCustomData,
                'Tags': options.tags,
                'Request': {
                    'Url': [location.protocol, '//', location.host, location.pathname, location.hash].join(''),
                    'QueryString': qs,
                    'Headers': {
                        'User-Agent': navigator.userAgent,
                        'Referer': document.referrer,
                        'Host': document.domain
                    }
                },
                'Version': _version || 'Not supplied'
            }
        };

        payload.Details.User = _user;

        if (_filterScope === 'all') {
            payload = filterObject(payload);
        }

        if (typeof _groupingKeyCallback === 'function') {
            _private.log('Raygun4JS: calling custom grouping key');
            payload.Details.GroupingKey = _groupingKeyCallback(payload, stackTrace, options);
        }

        if (typeof _beforeSendCallback === 'function') {
            var mutatedPayload = _beforeSendCallback(payload);

            if (mutatedPayload) {
                sendToRaygun(mutatedPayload);
            }
        } else {
            sendToRaygun(payload);
        }
    }

    function sendToRaygun(data) {
        if (!isApiKeyConfigured()) {
            return;
        }

        _private.log('Sending exception data to Raygun:', data);
        var url = _raygunApiUrl + '/entries?apikey=' + encodeURIComponent(_raygunApiKey);
        makePostCorsRequest(url, JSON.stringify(data));
    }

    // Create the XHR object.
    function createCORSRequest(method, url) {
        var xhr;

        xhr = new window.XMLHttpRequest();
        if ("withCredentials" in xhr) {
            // XHR for Chrome/Firefox/Opera/Safari.
            xhr.open(method, url, true);

        } else if (window.XDomainRequest) {
            // XDomainRequest for IE.
            if (_allowInsecureSubmissions) {
                // remove 'https:' and use relative protocol
                // this allows IE8 to post messages when running
                // on http
                url = url.slice(6);
            }

            xhr = new window.XDomainRequest();
            xhr.open(method, url);
        }

        xhr.timeout = 10000;

        return xhr;
    }

    // Make the actual CORS request.
    function makePostCorsRequest(url, data) {
        var xhr = createCORSRequest('POST', url, data);

        if ('withCredentials' in xhr) {

            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) {
                    return;
                }

                if (xhr.status === 202) {
                    sendSavedErrors();
                } else if (_enableOfflineSave && xhr.status !== 403 && xhr.status !== 400 && xhr.status !== 429) {
                    offlineSave(url, data);
                }
            };

            xhr.onload = function () {
                _private.log('posted to Raygun');
            };

        } else if (window.XDomainRequest) {
            xhr.ontimeout = function () {
                if (_enableOfflineSave) {
                    _private.log('Raygun: saved locally');
                    offlineSave(url, data);
                }
            };

            xhr.onload = function () {
                _private.log('posted to Raygun');
                sendSavedErrors();
            };
        }

        xhr.onerror = function () {
            _private.log('failed to post to Raygun');
        };

        if (!xhr) {
            _private.log('CORS not supported');
            return;
        }

        xhr.send(data);
    }

    if (!window.Raygun) {
        window.Raygun = Raygun;
    }

    // Mozilla's toISOString() shim for IE8
    if (!Date.prototype.toISOString) {
        (function () {
            function pad(number) {
                var r = String(number);
                if (r.length === 1) {
                    r = '0' + r;
                }
                return r;
            }

            Date.prototype.toISOString = function () {
                return this.getUTCFullYear() + '-' + pad(this.getUTCMonth() + 1) + '-' + pad(this.getUTCDate()) + 'T' + pad(this.getUTCHours()) + ':' + pad(this.getUTCMinutes()) + ':' + pad(this.getUTCSeconds()) + '.' + String((this.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5) + 'Z';
            };
        }());
    }

    // Mozilla's bind() shim for IE8
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== 'function') {
                throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                FNOP = function () {
                },
                fBound = function () {
                    return fToBind.apply(this instanceof FNOP && oThis ? this : oThis,
                        aArgs.concat(Array.prototype.slice.call(arguments)));
                };

            FNOP.prototype = this.prototype;
            fBound.prototype = new FNOP();

            return fBound;
        };
    }

    return Raygun;
};

window.__instantiatedRaygun = raygunFactory(window, window.jQuery);
var raygunRumFactory = function (window, $, Raygun) {
    Raygun.RealUserMonitoring = function (apiKey, apiUrl, makePostCorsRequest, user, version, excludedHostNames, excludedUserAgents, debugMode, maxVirtualPageDuration) {
        var self = this;
        var _private = {};

        this.cookieName = 'raygun4js-sid';
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.debugMode = debugMode;
        this.excludedHostNames = excludedHostNames;
        this.excludedUserAgents = excludedUserAgents;
        this.maxVirtualPageDuration = maxVirtualPageDuration || 1800000; // 30 minutes

        this.makePostCorsRequest = function (url, data) {
            if (self.excludedUserAgents instanceof Array) {
                for (var userAgentIndex in self.excludedUserAgents) {
                    if (self.excludedUserAgents.hasOwnProperty(userAgentIndex)) {
                        if (navigator.userAgent.match(self.excludedUserAgents[userAgentIndex])) {
                            if (self.debugMode) {
                                log('Raygun4JS: cancelling send as error originates from an excluded user agent');
                            }

                            return;
                        }
                    }
                }
            }

            if (self.excludedHostNames instanceof Array) {
                for (var hostIndex in self.excludedHostNames) {
                    if (self.excludedHostNames.hasOwnProperty(hostIndex)) {
                        if (window.location.hostname && window.location.hostname.match(self.excludedHostNames[hostIndex])) {
                            log('Raygun4JS: cancelling send as error originates from an excluded hostname');

                            return;
                        }
                    }
                }
            }

            makePostCorsRequest(url, data);
        };
        this.sessionId = null;
        this.virtualPage = null;
        this.user = user;
        this.version = version;
        this.heartBeatInterval = null;
        this.offset = 0;

        this.attach = function () {
            getSessionId(function (isNewSession) {
                self.pageLoaded(isNewSession);
            });

            var clickHandler = function () {
                this.updateCookieTimestamp();
            }.bind(_private);
            
            var unloadHandler = function () {
                var data = [];

                extractChildData(data);

                if (data.length > 0) {
                    var payload = {
                        eventData: [{
                            sessionId: self.sessionId,
                            timestamp: new Date().toISOString(),
                            type: 'web_request_timing',
                            user: self.user,
                            version: self.version || 'Not supplied',
                            device: navigator.userAgent,
                            data: JSON.stringify(data)
                        }]
                    };

                    self.makePostCorsRequest(self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey), JSON.stringify(payload));
                }
            };

            var visibilityChangeHandler = function () {
                if (document.visibilityState === 'visible') {
                    this.updateCookieTimestamp();
                }

            }.bind(_private);

            if (window.addEventListener) {
                window.addEventListener('click', clickHandler);
                document.addEventListener('visibilitychange', visibilityChangeHandler);
                window.addEventListener('beforeunload', unloadHandler);
            } else if (window.attachEvent) {
                document.attachEvent('onclick', clickHandler);
            }
        };

        this.pageLoaded = function (isNewSession) {
            // Only create a session if we don't have one.
            if (isNewSession) {
                var payload = {
                    eventData: [{
                        sessionId: self.sessionId,
                        timestamp: new Date().toISOString(),
                        type: 'session_start',
                        user: self.user,
                        version: self.version || 'Not supplied',
                        device: navigator.userAgent
                    }]
                };

                self.makePostCorsRequest(self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey), JSON.stringify(payload));
            }

            self.sendPerformance(true, true);
            self.heartBeat();
            
            if (typeof window.performance === 'object' && typeof window.performance.now === 'function') {
              self.initalStaticPageLoadTimestamp = window.performance.now();
            } else {
              self.initalStaticPageLoadTimestamp = 0;
            }
        };

        this.setUser = function (user) {
            self.user = user;
        };

        this.endSession = function () {
            var payload = {
                eventData: [{
                    sessionId: self.sessionId,
                    timestamp: new Date().toISOString(),
                    type: 'session_end'

                }]
            };

            self.makePostCorsRequest(self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey), JSON.stringify(payload));
        };

        this.heartBeat = function () {
            self.heartBeatInterval = setInterval(function () {
                var data = [];
                var payload;

                extractChildData(data, self.virtualPage);

                if (data.length > 0) {
                    var dataJson = JSON.stringify(data);

                    if (stringToByteLength(dataJson) < 128000) { // 128kB payload size
                      payload = {
                          eventData: [{
                              sessionId: self.sessionId,
                              timestamp: new Date().toISOString(),
                              type: 'web_request_timing',
                              user: self.user,
                              version: self.version || 'Not supplied',
                              device: navigator.userAgent,
                              data: dataJson
                          }]
                      };
                    }
                }

                if (payload !== undefined) {
                    self.makePostCorsRequest(self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey), JSON.stringify(payload));
                }
          }, 30 * 1000); // 30 seconds between heartbeats
        };

        this.virtualPageLoaded = function (path) {
            var firstVirtualLoad = this.virtualPage == null;
            
            if (typeof path === 'string') {
                if (path.length > 0 && path[0] !== '/') {
                  path = path + '/';
                }

                this.virtualPage = path;
            }
            
            if (firstVirtualLoad) {
              this.sendPerformance(true, false);
            } else {
              this.sendPerformance(false, false);
            }
            
            if (typeof path === 'string') {
              if (typeof window.performance === 'object' && typeof window.performance.now === 'function') {
                this.previousVirtualPageLoadTimestamp = window.performance.now();
              } else {
                this.previousVirtualPageLoadTimestamp = 0;
              }
            }
        };

        this.sendPerformance = function (flush, firstLoad) {
            var performanceData = getPerformanceData(this.virtualPage, flush, firstLoad);

            if (performanceData === null) {
                return;
            }

            var payload = {
                eventData: [{
                    sessionId: self.sessionId,
                    timestamp: new Date().toISOString(),
                    type: 'web_request_timing',
                    user: self.user,
                    version: self.version || 'Not supplied',
                    device: navigator.userAgent,
                    data: JSON.stringify(performanceData)
                }]
            };

            self.makePostCorsRequest(self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey), JSON.stringify(payload));
        };

        function stringToByteLength(str) {
            var m = encodeURIComponent(str).match(/%[89ABab]/g);
            return str.length + (m ? m.length : 0);
        }

        function getSessionId(callback) {
            var existingCookie = readCookie(self.cookieName);

            var nullCookie = existingCookie === null;
            var legacyCookie = typeof exisitingCookie === 'string' &&
                existingCookie.length > 0 &&
                existingCookie.indexOf('timestamp') === -1;
            var expiredCookie = null;

            if (!nullCookie && !legacyCookie) {
                var existingTimestamp = new Date(readSessionCookieElement(existingCookie, 'timestamp'));
                var halfHrAgo = new Date(new Date() - 30 * 60000);
                expiredCookie = existingTimestamp < halfHrAgo;
            }

            if (nullCookie || legacyCookie || expiredCookie) {
                self.sessionId = randomKey(32);
                createCookie(self.cookieName, self.sessionId);
                callback(true);
            } else {
                var sessionCookie = readCookie(self.cookieName);
                var id = readSessionCookieElement(sessionCookie, 'id');

                if (id === 'undefined') {
                    self.sessionId = randomKey(32);
                    createCookie(self.cookieName, self.sessionId);
                    callback(true);
                } else {
                    self.sessionId = id;
                    callback(false);
                }
            }
        }

        function createCookie(name, value, hours) {
            var expires;
            var lastActivityTimestamp;

            if (hours) {
                var date = new Date();
                date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
                expires = "; expires=" + date.toGMTString();
            }
            else {
                expires = "";
            }

            lastActivityTimestamp = new Date().toISOString();

            document.cookie = name + "=id|" + value + "&timestamp|" + lastActivityTimestamp + expires + "; path=/";
        }

        function readSessionCookieElement(cookieString, element) {
            var set = cookieString.split(/[|&]/);

            if (element === 'id') {
                return set[1];
            } else if (element === 'timestamp') {
                return set[3];
            }
        }

        function readCookie(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1, c.length);
                }
                if (c.indexOf(nameEQ) === 0) {
                    return c.substring(nameEQ.length, c.length);
                }
            }
            return null;
        }

        function updateCookieTimestamp() {
            var existingCookie = readCookie(self.cookieName);

          var expiredCookie;
          if (existingCookie) {
            var timestamp = new Date(readSessionCookieElement(existingCookie, 'timestamp'));
            var halfHrAgo = new Date(new Date() - 30 * 60000); // 30 mins
            expiredCookie = timestamp < halfHrAgo;
          }
          else {
            expiredCookie = true;
          }

            if (expiredCookie) {
                self.sessionId = randomKey(32);
            }

            createCookie(self.cookieName, self.sessionId);

            if (expiredCookie) {
                self.pageLoaded(true);
            }
        }

        function maxFiveMinutes(milliseconds) {
            return Math.min(milliseconds, 300000);
        }

        function sanitizeNaNs(data) {
            for (var i in data) {
                if (isNaN(data[i]) && typeof data[i] !== 'string') {
                    data[i] = 0;
                }
            }

            return data;
        }

        function generateVirtualEncodedTimingData(previousVirtualPageLoadTimestamp, initalStaticPageLoadTimestamp) {
          var now;
          if (typeof window.performance === 'object' && typeof window.performance.now === 'function') {
            now = window.performance.now();
          } else {
            now = 0;
          }
          
          return {
            t: 'v',
            du: Math.min(self.maxVirtualPageDuration, now - (previousVirtualPageLoadTimestamp || initalStaticPageLoadTimestamp)),
            o: Math.min(self.maxVirtualPageDuration, now - initalStaticPageLoadTimestamp)
          };
        }

        function getEncodedTimingData(timing, offset) {
            var data = {
                du: timing.duration,
                t: 'p'
            };

            data.a = offset + timing.fetchStart;

            if (timing.domainLookupStart && timing.domainLookupStart > 0) {
                data.b = (offset + timing.domainLookupStart) - data.a;
            }

            if (timing.domainLookupEnd && timing.domainLookupEnd > 0) {
                data.c = (offset + timing.domainLookupEnd) - data.a;
            }

            if (timing.connectStart && timing.connectStart > 0) {
                data.d = (offset + timing.connectStart) - data.a;
            }

            if (timing.connectEnd && timing.connectEnd > 0) {
                data.e = (offset + timing.connectEnd) - data.a;
            }

            if (timing.responseStart && timing.responseStart > 0) {
                data.f = (offset + timing.responseStart) - data.a;
            }

            if (timing.responseEnd && timing.responseEnd > 0) {
                data.g = (offset + timing.responseEnd) - data.a;
            }

            if (timing.domLoading && timing.domLoading > 0) {
                data.h = (offset + timing.domLoading) - data.a;
            }

            if (timing.domInteractive && timing.domInteractive > 0) {
                data.i = (offset + timing.domInteractive) - data.a;
            }

            if (timing.domContentLoadedEventEnd && timing.domContentLoadedEventEnd > 0) {
                data.j = (offset + timing.domContentLoadedEventEnd) - data.a;
            }

            if (timing.domComplete && timing.domComplete > 0) {
                data.k = maxFiveMinutes((offset + timing.domComplete) - data.a);
            }

            if (timing.loadEventStart && timing.loadEventStart > 0) {
                data.l = (offset + timing.loadEventStart) - data.a;
            }

            if (timing.loadEventEnd && timing.loadEventEnd > 0) {
                data.m = (offset + timing.loadEventEnd) - data.a;
            }

            if (timing.secureConnectionStart && timing.secureConnectionStart > 0) {
                data.n = (offset + (timing.secureConnectionStart - timing.connectStart)) - data.a;
            }

            data = sanitizeNaNs(data);

            return data;
        }

        function getSecondaryEncodedTimingData(timing, offset) {
            var data = {
                du: maxFiveMinutes(timing.duration).toFixed(2),
                t: timing.initiatorType === 'xmlhttprequest' ? 'x' : timing.duration === 0.0 ? 'e' : 'c',
                a: (offset + timing.fetchStart).toFixed(2)
            };

            if (timing.domainLookupStart && timing.domainLookupStart > 0) {
                data.b = (offset + timing.domainLookupStart) - data.a;
            }

            if (timing.domainLookupEnd && timing.domainLookupEnd > 0) {
                data.c = (offset + timing.domainLookupEnd) - data.a;
            }

            if (timing.connectStart && timing.connectStart > 0) {
                data.d = (offset + timing.connectStart) - data.a;
            }

            if (timing.connectEnd && timing.connectEnd > 0) {
                data.e = (offset + timing.connectEnd) - data.a;
            }

            if (timing.responseStart && timing.responseStart > 0) {
                data.f = (offset + timing.responseStart) - data.a;
            }

            if (timing.responseEnd && timing.responseEnd > 0) {
                data.g = (offset + timing.responseEnd) - data.a;
            }

            if (timing.secureConnectionStart && timing.secureConnectionStart > 0) {
                data.n = (offset + (timing.secureConnectionStart - timing.connectStart)) - data.a;
            }

            data = sanitizeNaNs(data);

            return data;
        }

        function getPrimaryTimingData() {
            return {
                url: window.location.protocol + '//' + window.location.host + window.location.pathname,
                userAgent: navigator.userAgent,
                timing: getEncodedTimingData(window.performance.timing, 0),
                size: 0
            };
        }

        function getVirtualPrimaryTimingData(virtualPage, previousVirtualPageLoadTimestamp, initalStaticPageLoadTimestamp) {
            return {
                url: window.location.protocol + '//' + window.location.host + virtualPage,
                userAgent: navigator.userAgent,
                timing: generateVirtualEncodedTimingData(previousVirtualPageLoadTimestamp, initalStaticPageLoadTimestamp),
                size: 0
            };
        }

        function getSecondaryTimingData(timing, fromZero) {
            return {
                url: timing.name.split('?')[0],
                timing: getSecondaryEncodedTimingData(timing, fromZero ? 0 : window.performance.timing.navigationStart),
                size: timing.decodedBodySize || 0
            };
        }

        function extractChildData(collection, fromVirtualPage) {
            if (window.performance === undefined || !window.performance.getEntries) {
                return;
            }

            try {
                var resources = window.performance.getEntries();

                for (var i = self.offset; i < resources.length; i++) {
                    var segment = resources[i].name.split('?')[0];

                    // swallow any calls to Raygun itself
                    if (segment.indexOf(self.apiUrl) === 0) {
                        continue;
                    }

                    // Other ignored calls
                    if (segment.indexOf('favicon.ico') > 0) {
                        continue;
                    }
                    if (segment.indexOf('about:blank') === 0) {
                        continue;
                    }
                    if (segment[0] === 'j' && segment.indexOf('avascript:') === 1) {
                        continue;
                    }
                    if (segment.indexOf('chrome-extension://') === 0) {
                        continue;
                    }
                    if (segment.indexOf('res://') === 0) {
                        continue;
                    }
                    if (segment.indexOf('file://') === 0) {
                        continue;
                    }

                    collection.push(getSecondaryTimingData(resources[i], fromVirtualPage));
                }

                self.offset = resources.length;
            }
            catch (e) {
            }
        }

        function getPerformanceData(virtualPage, flush, firstLoad) {
            if (window.performance === undefined || isNaN(window.performance.timing.fetchStart)) {
                return null;
            }

            var data = [];
            
            if (flush) {
              // Called by the static onLoad event being fired, persist itself
              if (firstLoad) { 
                data.push(getPrimaryTimingData());
              }
              
              // Called during both the static load event and the flush on the first virtual load call
              extractChildData(data);  
            }

            if (virtualPage) {
              // A previous virtual load was stored, persist it and its children up until now
              if (self.pendingVirtualPage) {
                data.push(self.pendingVirtualPage);
                extractChildData(data, true);
              }
              
              var firstVirtualLoad = self.pendingVirtualPage == null;
              
              // Store the current virtual load so it can be sent upon the next one
              self.pendingVirtualPage = getVirtualPrimaryTimingData(
                virtualPage,
                self.previousVirtualPageLoadTimestamp,
                self.initalStaticPageLoadTimestamp
              );
              
              // Prevent sending an empty payload for the first virtual load as we don't know when it will end
              if (!firstVirtualLoad && data.length > 0) {
                return data;
              }
            }

            return data;
        }

        function randomKey(length) {
            return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
        }

        function log(message, data) {
            if (window.console && window.console.log && self.debugMode) {
                window.console.log(message);

                if (data) {
                    window.console.log(data);
                }
            }
        }

        _private.updateCookieTimestamp = updateCookieTimestamp;
    };
};

raygunRumFactory(window, window.jQuery, window.__instantiatedRaygun);
// js-url - see LICENSE file

var raygunJsUrlFactory = function (window, Raygun) {

  Raygun._private.parseUrl = function(arg, url) {
    function isNumeric(arg) {
      return !isNaN(parseFloat(arg)) && isFinite(arg);
    }

    return (function(arg, url) {
        var _ls = url || window.location.toString();

        if (!arg) { return _ls; }
        else { arg = arg.toString(); }

        if (_ls.substring(0,2) === '//') { _ls = 'http:' + _ls; }
        else if (_ls.split('://').length === 1) { _ls = 'http://' + _ls; }

        url = _ls.split('/');
        var _l = {auth:''}, host = url[2].split('@');

        if (host.length === 1) { host = host[0].split(':'); }
        else { _l.auth = host[0]; host = host[1].split(':'); }

        _l.protocol=url[0];
        _l.hostname=host[0];
        _l.port=(host[1] || ((_l.protocol.split(':')[0].toLowerCase() === 'https') ? '443' : '80'));
        _l.pathname=( (url.length > 3 ? '/' : '') + url.slice(3, url.length).join('/').split('?')[0].split('#')[0]);
        var _p = _l.pathname;

        if (_p.charAt(_p.length-1) === '/') { _p=_p.substring(0, _p.length-1); }
        var _h = _l.hostname, _hs = _h.split('.'), _ps = _p.split('/');

        if (arg === 'hostname') { return _h; }
        else if (arg === 'domain') {
            if (/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/.test(_h)) { return _h; }
            return _hs.slice(-2).join('.');
        }
        //else if (arg === 'tld') { return _hs.slice(-1).join('.'); }
        else if (arg === 'sub') { return _hs.slice(0, _hs.length - 2).join('.'); }
        else if (arg === 'port') { return _l.port; }
        else if (arg === 'protocol') { return _l.protocol.split(':')[0]; }
        else if (arg === 'auth') { return _l.auth; }
        else if (arg === 'user') { return _l.auth.split(':')[0]; }
        else if (arg === 'pass') { return _l.auth.split(':')[1] || ''; }
        else if (arg === 'path') { return _l.pathname; }
        else if (arg.charAt(0) === '.')
        {
            arg = arg.substring(1);
            if(isNumeric(arg)) {arg = parseInt(arg, 10); return _hs[arg < 0 ? _hs.length + arg : arg-1] || ''; }
        }
        else if (isNumeric(arg)) { arg = parseInt(arg, 10); return _ps[arg < 0 ? _ps.length + arg : arg] || ''; }
        else if (arg === 'file') { return _ps.slice(-1)[0]; }
        else if (arg === 'filename') { return _ps.slice(-1)[0].split('.')[0]; }
        else if (arg === 'fileext') { return _ps.slice(-1)[0].split('.')[1] || ''; }
        else if (arg.charAt(0) === '?' || arg.charAt(0) === '#')
        {
            var params = _ls, param = null;

            if(arg.charAt(0) === '?') { params = (params.split('?')[1] || '').split('#')[0]; }
            else if(arg.charAt(0) === '#') { params = (params.split('#')[1] || ''); }

            if(!arg.charAt(1)) { return params; }

            arg = arg.substring(1);
            params = params.split('&');

            for(var i=0,ii=params.length; i<ii; i++)
            {
                param = params[i].split('=');
                if(param[0] === arg) { return param[1] || ''; }
            }

            return null;
        }

        return '';
    })(arg, url);
};

};

raygunJsUrlFactory(window, window.__instantiatedRaygun);
window.__instantiatedRaygun._seal();
(function (window, Raygun) {
  if (!window['RaygunObject'] || !window[window['RaygunObject']]) {
    return;
  }

  var snippetOptions = window[window['RaygunObject']].o;
  var errorQueue,
    apiKey,
    options,
    attach,
    enablePulse,
    noConflict;

  errorQueue = window[window['RaygunObject']].q;
  var rg = Raygun;

  var executor = function (pair) {
    var key = pair[0];
    var value = pair[1];

    if (key) {
      switch (key) {
        case 'noConflict':
          noConflict = value;
          break;
        case 'apiKey':
          apiKey = value;
          break;
        case 'options':
          options = value;
          break;
        case 'attach':
        case 'enableCrashReporting':
          attach = value;
          break;
        case 'enablePulse':
          enablePulse = value;
          break;
        case 'getRaygunInstance':
          return rg;
        case 'setUser':
          rg.setUser(value.identifier, value.isAnonymous, value.email, value.fullName, value.firstName, value.uuid);
          break;
        case 'onBeforeSend':
          rg.onBeforeSend(value);
          break;
        case 'withCustomData':
          rg.withCustomData(value);
          break;
        case 'withTags':
          rg.withTags(value);
          break;
        case 'setVersion':
          rg.setVersion(value);
          break;
        case 'filterSensitiveData':
          rg.filterSensitiveData(value);
          break;
        case 'setFilterScope':
          rg.setFilterScope(value);
          break;
        case 'whitelistCrossOriginDomains':
          rg.whitelistCrossOriginDomains(value);
          break;
        case 'saveIfOffline':
          if (typeof value === 'boolean') {
            rg.saveIfOffline(value);
          }
          break;
        case 'groupingKey':
          rg.groupingKey(value);
          break;
      }
    }
  };

  for (var i in snippetOptions) {
    var pair = snippetOptions[i];
    if (pair) {
      executor(pair);
    }
  }

  var onLoadHandler = function () {
    if (noConflict) {
      rg = Raygun.noConflict();
    }
    
    if (apiKey) {
      if (!options) {
        options = {};
      }

      if (enablePulse) {
        options.disablePulse = false;
      }

      options.from = 'onLoad';
      rg.init(apiKey, options, null);
    }

    if (attach) {
      rg.attach();

      errorQueue = window[window['RaygunObject']].q;
      for (var j in errorQueue) {
        rg.send(errorQueue[j].e, { handler: 'From Raygun4JS snippet global error handler' });
      }
    } else {
      window.onerror = null;
    }
  };

  if (document.readyState === 'complete') {
    onLoadHandler();
  } else if (window.addEventListener) {
    window.addEventListener('load', onLoadHandler);
  } else {
    window.attachEvent('onload', onLoadHandler);
  }

  window[window['RaygunObject']] = function () {
    return executor(arguments);
  };
  window[window['RaygunObject']].q = errorQueue;

})(window, window.__instantiatedRaygun);

try 
{ 
    delete window.__instantiatedRaygun;
} 
catch(e) 
{ 
    window["__instantiatedRaygun"] = undefined; 
}