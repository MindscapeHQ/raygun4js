/**
 * @prettier
 */

window.raygunErrorUtilitiesFactory = function (window, Raygun) {
  var scriptError = 'Script error';
  var currentLocation = window.location;
  var currentUrl = currentLocation.toString();

  var isBrowserExtensionUrl = function isBrowserExtensionUrl(url) {
    return url.indexOf('chrome-extension://') === 0 ||
      url.indexOf('moz-extension://') === 0 ||
      url.indexOf('safari-extension://') === 0 ||
      url.indexOf('safari-web-extension://') === 0;
  };

  // The stack line is deemed invalid if all of the following conditions are met:
  // 1. The line and column numbers are zero
  // 2. The url is nil *or* the same as the current location *and* the function is '?'
  var isInvalidStackLine = function isInvalidStackLine(stackLine) {
    if (!Raygun.Utilities.isNil(stackLine.line) && stackLine.line > 0) {
      return false;
    }

    if (!Raygun.Utilities.isNil(stackLine.column) && stackLine.column > 0) {
      return false;
    }

    if (!Raygun.Utilities.isNil(stackLine.url)) {
      return currentUrl.indexOf(stackLine.url) !== -1 && stackLine.func === '?';
    }

    return true;
  };

  return {
    /**
     * Check if the current stacktrace is a Script error from an external domain.
     *
     * @param stackTrace
     * @param options
     * @returns {boolean}
     */
    isScriptError: function isScriptError(stackTrace, options) {
      var msg = scriptError;

      if (stackTrace.message) {
        msg = stackTrace.message;
      } else if (options && options.status) {
        msg = options.status;
      }

      if (typeof msg === 'undefined') {
        msg = scriptError;
      }

      return !Raygun.Utilities.isReactNative() &&
        typeof msg.substring === 'function' &&
        msg.substring(0, scriptError.length) === scriptError &&
        !Raygun.Utilities.isNil(stackTrace.stack[0].url) &&
        stackTrace.stack[0].url.indexOf(currentLocation.host) === -1 &&
        (stackTrace.stack[0].line === 0 || stackTrace.stack[0].func === '?');
    },

    /**
     * Check if the stacktrace from a browser extension - if any stack line has a url that starts with a browser
     * extension protocol (e.g. "chrome-extension://"), then this will return true.
     *
     * @param stackTrace
     * @returns {boolean}
     */
    isBrowserExtensionError: function isBrowserExtensionError(stackTrace) {
      var stack = stackTrace.stack;

      if (Raygun.Utilities.isEmpty(stack)) {
        return false;
      }

      return Raygun.Utilities.any(stack, function (stackLine) {
        var url = stackLine.url;

        return !Raygun.Utilities.isNil(url) && isBrowserExtensionUrl(url);
      });
    },

    /**
     * Check if all lines in the stack are invalid, i.e. they have a line and column number of zero and a url of null or
     * a url that matches the current host *and* a function called '?'.
     *
     * @param stackTrace
     * @returns {boolean}
     */
    isInvalidStackTrace: function isInvalidStackTrace(stackTrace) {
      var stack = stackTrace.stack;

      if (Raygun.Utilities.isNil(stackTrace.message) || Raygun.Utilities.isEmpty(stack)) {
        return true;
      }

      return Raygun.Utilities.all(stack, isInvalidStackLine);
    },

    /**
     * Check if the current stacktrace has any lines that have a url that matches the current url. This function can be
     * passed a list of whitelisted domains that will be checked against.
     *
     * @param stackTrace
     * @param whitelistedScriptDomains string[]
     * @returns {boolean}
     */
    stackTraceHasValidDomain: function stackTraceHasValidDomain(stackTrace, whitelistedScriptDomains) {
      var foundValidDomain = false;

      for (var i = 0; !foundValidDomain && stackTrace.stack && i < stackTrace.stack.length; i++) {
        if (
          !Raygun.Utilities.isNil(stackTrace.stack[i]) &&
          !Raygun.Utilities.isNil(stackTrace.stack[i].url)
        ) {
          for (var j in whitelistedScriptDomains) {
            if (whitelistedScriptDomains.hasOwnProperty(j)) {
              if (stackTrace.stack[i].url.indexOf(whitelistedScriptDomains[j]) > -1) {
                foundValidDomain = true;
              }
            }
          }

          if (stackTrace.stack[i].url.indexOf(currentLocation.host) > -1) {
            foundValidDomain = true;
          }
        }
      }

      return foundValidDomain;
    }
  };
};
