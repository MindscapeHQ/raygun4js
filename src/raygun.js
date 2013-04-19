/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2013 MindscapeHQ
 * Licensed under the MIT license.
 */

(function (window) {
  // pull local copy of TraceKit to handle stack trace collection
  var _traceKit = TraceKit.noConflict(),
      _raygun = window.Raygun,
      _raygunApiKey,
      _debugMode = false,
      _customData = {};

  var Raygun =
  {
    noConflict: function () {
      window.Raygun = _raygun;
      return Raygun;
    },

    init: function(key, options, customdata) {
      _raygunApiKey = key;
      _traceKit.remoteFetching = false;
      _customData = customdata;

      if (options)
      {
        if (options.debugMode)
        {
          _debugMode = options.debugMode;
        }
      }

      return Raygun;
    },

    withCustomData: function (customdata) {
      _customData = customdata;
      return Raygun;
    },

    attach: function () {
      if (!isApiKeyConfigured()) {
        return;
      }
      _traceKit.report.subscribe(processUnhandledException);
      return Raygun;
    },

    detach: function () {
      _traceKit.report.unsubscribe(processUnhandledException);
      return Raygun;
    },

    send: function (ex, customData) {
      try {
        _traceKit.report(ex, merge(_customData, customData));
      }
      catch (traceKitException) {
        if (ex !== traceKitException) {
          throw traceKitException;
        }
      }
      return Raygun;
    }
  };

  /* internals */

  function log(message) {
    if (window.console && window.console.log && _debugMode) {
      window.console.log(message);
    }
  }

  function isApiKeyConfigured() {
    if (_raygunApiKey && _raygunApiKey !== '') {
      return true;
    }
    log("Raygun API key has not been configured, make sure you call Raygun.init(yourApiKey)");
    return false;
  }

  function merge(o1, o2) {
    var a, o3 = {};
    for (a in o1) { o3[a] = o1[a]; }
    for (a in o2) { o3[a] = o2[a]; }
    return o3;
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

  function getViewPort() {
    var e = document.documentElement,
    g = document.getElementsByTagName('body')[0],
    x = window.innerWidth || e.clientWidth || g.clientWidth,
    y = window.innerHeight || e.clientHeight || g.clientHeight;
    return { width: x, height: y };
  }

  function processUnhandledException(stackTrace, options) {
    var stack = [],
        qs = {};

    if (stackTrace.stack && stackTrace.stack.length) {
      forEach(stackTrace.stack, function (i, frame) {
        stack.push({
          'LineNumber': frame.line,
          'ClassName': 'line ' + frame.line + ', column ' + frame.column,
          'FileName': frame.url,
          'MethodName': frame.func || '[anonymous]'
        });
      });
    }

    if (window.location.search && window.location.search.length > 1) {
      forEach(window.location.search.substring(1).split('&'), function (i, segment) {
        var parts = segment.split('=');
        if (parts && parts.length === 2) {
          qs[decodeURIComponent(parts[0])] = parts[1];
        }
      });
    }

    if (isEmpty(options)) {
      options = _customData;
    }

    var screen = window.screen || { width: getViewPort().width, height: getViewPort().height, colorDepth: 8 };

    sendToRaygun({
      'OccurredOn': new Date(),
      'Details': {
        'Error': {
          'ClassName': stackTrace.name,
          'Message': stackTrace.message || 'Script error',
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
          'Version': '1.2.0'
        },
        'UserCustomData': options,
        'Request': {
          'Url': document.location.href,
          'QueryString': qs,
          'Headers': {
            'User-Agent': navigator.userAgent,
            'Referer': document.referrer,
            'Host': document.domain
          }
        }
      }
    });
  }

  function sendToRaygun(data) {
    if (!isApiKeyConfigured()) {
      return;
    }
    log('Sending exception data to Raygun:', data);
    var url = 'https://api.raygun.io/entries?apikey=' + encodeURIComponent(_raygunApiKey);
    makeCorsRequest(url, JSON.stringify(data));
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
      xhr = new window.XDomainRequest();
      xhr.open(method, url);
    }

    xhr.onload = function () {
      log('logged error to Raygun');
    };
    xhr.onerror = function () {
      log('failed to log error to Raygun');
    };

    return xhr;
  }

  // Make the actual CORS request.
  function makeCorsRequest(url, data) {
    var xhr = createCORSRequest('POST', url);
    if (!xhr) {
      log('CORS not supported');
      return;
    }

    xhr.send(data);
  }

  window.Raygun = Raygun;
})(window);
