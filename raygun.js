(function (window) {
  // pull local copy of TraceKit to handle stack trace collection
  var _traceKit = TraceKit.noConflict(),
      _raygun = window.Raygun,
      _raygunApiKey,
      _debugMode = false;

  var Raygun =
  {
    noConflict: function () {
      window.Raygun = _raygun;
      return Raygun;
    },

    init: function(key, options) {
      _raygunApiKey = key;
      _traceKit.remoteFetching = false;
      
      if (options)
      {
      	if (options.debugMode)
      	{
          _debugMode = options.debugMode;
      	}
      }

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

    send: function (ex) {
      try {
        _traceKit.report(ex, {});
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

  function forEach(set, func) {
    for (var i = 0; i < set.length; i++) {
      func.call(null, i, set[i]);
    }
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

    sendToRaygun({
      'OccurredOn': new Date(),
      'Details': {
        'Error': {
          'ClassName': stackTrace.name,
          'Message': stackTrace.message || 'Script error',
          'StackTrace': stack
        },
        'Environment': {},
        'Client': {
          'Name': 'raygun-js',
          'Version': '1.0.0'
        },
        'UserCustomData': options,
        'Request': {
          'Url': document.location.href,
          'QueryString': qs
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
