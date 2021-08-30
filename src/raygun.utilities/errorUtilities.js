/**
 * @prettier
 */

window.raygunErrorUtilitiesFactory = function (window, Raygun) {
  var scriptError = 'Script error';
  var currentLocation = !!window && !!window.location ? window.location : {
    host: null,
    toString: function toString() {
      return null;
    }
  };
  var currentUrl = currentLocation.toString();
  var utils = Raygun.Utilities;

  var isBrowserExtensionUrl = function isBrowserExtensionUrl(url) {
    return url.indexOf('chrome-extension://') === 0 ||
      url.indexOf('moz-extension://') === 0 ||
      url.indexOf('safari-extension://') === 0 ||
      url.indexOf('safari-web-extension://') === 0;
  };

  // The stack line is deemed invalid if all of the following conditions are met:
  // 1. The line and column numbers are nil *or* zero
  // 2. The url is nil *or* the same as the current location *and* the function is '?'
  var isValidStackLine = function isValidStackLine(stackLine) {
    if (!utils.isNil(stackLine.line) && stackLine.line > 0) {
      return true;
    }

    if (!utils.isNil(stackLine.column) && stackLine.column > 0) {
      return true;
    }

    if (utils.isNil(stackLine.url) || currentUrl.indexOf(stackLine.url) !== -1 && stackLine.func === '?') {
      return false;
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

      if (utils.isNil(msg)) {
        msg = scriptError;
      }

      return !utils.isReactNative() &&
        typeof msg.substring === 'function' &&
        msg.substring(0, scriptError.length) === scriptError &&
        !utils.isNil(stackTrace.stack[0].url) &&
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

      if (utils.isEmpty(stack)) {
        return false;
      }

      return utils.any(stack, function (stackLine) {
        var url = stackLine.url;

        return !utils.isNil(url) && isBrowserExtensionUrl(url);
      });
    },

    /**
     * Check if any lines in the stack are valid, i.e. they do not match the criteria of having a null/zero line and
     * column number and do not have a url equal to the current url with a function name of '?'.
     *
     * This is to filter out a common pattern of errors triggered in browser extensions or by bots/crawlers.
     *
     * @param stackTrace
     * @returns {boolean}
     */
    isValidStackTrace: function isValidStackTrace(stackTrace) {
      var stack = stackTrace.stack;

      if (utils.isNil(stackTrace.message) || utils.isEmpty(stack)) {
        return false;
      }

      return utils.any(stack, isValidStackLine);
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
        var stackLine = stackTrace.stack[i];

        if (!utils.isNil(stackLine) && !utils.isNil(stackLine.url)) {
          for (var j in whitelistedScriptDomains) {
            if (whitelistedScriptDomains.hasOwnProperty(j)) {
              if (stackLine.url.indexOf(whitelistedScriptDomains[j]) > -1) {
                foundValidDomain = true;
              }
            }
          }

          if (stackLine.url.indexOf(currentLocation.host) > -1) {
            foundValidDomain = true;
          }
        }
      }

      return foundValidDomain;
    }
  };
};
