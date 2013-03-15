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
      if (!isApiKeyConfigured()) return;
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

  function isApiKeyConfigured() {
    if (_raygunApiKey && _raygunApiKey !== '') return true;
    if (window.console && console.error) {
      console.error("Raygun API key has not been configured, make sure you call Raygun.init(yourApiKey)");
    }
    return false;
  }  

  function merge(o1, o2) {
    var o3 = {};
    for (var a in o1) { o3[a] = o1[a]; }
    for (var a in o2) { o3[a] = o2[a]; }
    return o3;
  }

  function forEach(set, func) {
    for (var i = 0; i < set.length; i++) {
      func.call(null, i, set[i]);
    }
  }

  function isEmpty(o) {
    for (var p in o) {
      if (o.hasOwnProperty(p)) return false;
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
        if (parts && parts.length == 2) {
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
          'Version': '1.0.1'
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
    if (!isApiKeyConfigured()) return;
    if (window.console && console.log && _debugMode) {
      console.log('Sending exception data to Raygun:', data);
    }
    var img = new Image(1,1);
    img.src = 'https://api.raygun.io/entries?apikey=' + encodeURIComponent(_raygunApiKey) + '&payload=' + encodeURIComponent(JSON.stringify(data));
  }  

  window.Raygun = Raygun;
})(window);
