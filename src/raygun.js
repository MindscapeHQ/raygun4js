/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2013 MindscapeHQ
 * Licensed under the MIT license.
 */

(function (window, $, undefined) {
  // pull local copy of TraceKit to handle stack trace collection
  var _traceKit = TraceKit.noConflict(),
      _raygun = window.Raygun,
      _raygunApiKey,
      _debugMode = false,
      _allowInsecureSubmissions = false,
      _enableOfflineSave = false,
      _customData = {},
      _tags = [],
      _user,
      _version,
      _raygunApiUrl = 'https://api.raygun.io',
      $document;

  if ($) {
    $document = $(document);
  }

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
        _allowInsecureSubmissions = options.allowInsecureSubmissions || false;
        if (options.debugMode)
        {
          _debugMode = options.debugMode;
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
    },

    attach: function () {
      if (!isApiKeyConfigured()) {
        return;
      }
      _traceKit.report.subscribe(processUnhandledException);
      if ($document) {
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

    setUser: function (user) {
      _user = { 'Identifier': user };
      return Raygun;
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
    }
  };

  /* internals */

  function truncateURL(url){
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
        truncated = truncated_parts.length < truncated_length.length?
                        truncated_parts : truncated_length;
        if (truncated !== sanitizedPath) {
            truncated += '..';
        }
      }

      return truncated;
  }

  function processJQueryAjaxError(event, jqXHR, ajaxSettings, thrownError) {
    var message = 'AJAX Error: ' +
        (jqXHR.statusText || 'unknown') +' '+
        (ajaxSettings.type || 'unknown') + ' '+
        (truncateURL(ajaxSettings.url) || 'unknown');
    Raygun.send(thrownError || event.type, {
      status: jqXHR.status,
      statusText: jqXHR.statusText,
      type: ajaxSettings.type,
      url: ajaxSettings.url,
      ajaxErrorMessage: message,
      contentType: ajaxSettings.contentType,
      data: ajaxSettings.data ? ajaxSettings.data.slice(0, 10240) : undefined });
  }

  function log(message, data) {
    if (window.console && window.console.log && _debugMode) {
      window.console.log(message);

      if (data) {
        window.console.log(data);
      }
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
    return { width: x, height: y };
  }

  function offlineSave (data) {
    var dateTime = new Date().toJSON();

    try {
      var key = 'raygunjs=' + dateTime + '=' + getRandomInt();

      if (typeof localStorage[key] === 'undefined') {
        localStorage[key] = data;
      }
    } catch (e) {
      log('Raygun4JS: LocalStorage full, cannot save exception');
    }
  }

  function localStorageAvailable(){
    try {
      return ('localStorage' in window) && window['localStorage'] !== null;
    } catch(e){
      return false;
    }
  }

  function sendSavedErrors() {
    if (localStorageAvailable() && localStorage.length > 0) {
        for (var key in localStorage) {
        if (key.substring(0, 9) === 'raygunjs=') {
          sendToRaygun(JSON.parse(localStorage[key]));

          localStorage.removeItem(key);
        }
      }
    }
  }

  function processUnhandledException(stackTrace, options) {
    var stack = [],
        qs = {};

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

    if (window.location.search && window.location.search.length > 1) {
      forEach(window.location.search.substring(1).split('&'), function (i, segment) {
        var parts = segment.split('=');
        if (parts && parts.length === 2) {
          qs[decodeURIComponent(parts[0])] = parts[1];
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
      options.tags = _tags;
    }

    var screen = window.screen || { width: getViewPort().width, height: getViewPort().height, colorDepth: 8 };
    var custom_message = options.customData && options.customData.ajaxErrorMessage;
    var finalCustomData = options.customData;

    try {
      JSON.stringify(finalCustomData);
    } catch (e) {
      var msg = 'Cannot add custom data; may contain circular reference';
      finalCustomData = { error: msg };
      log('Raygun4JS: ' + msg);
    }

    var payload = {
      'OccurredOn': new Date(),
      'Details': {
        'Error': {
          'ClassName': stackTrace.name,
          'Message': custom_message || stackTrace.message || options.status || 'Script error',
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
          'Version': '1.8.5'
        },
        'UserCustomData': finalCustomData,
        'Tags': options.tags,
        'Request': {
          'Url': document.location.href,
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

    if (_user) {
      payload.Details.User = _user;
    }

    sendToRaygun(payload);
  }

  function sendToRaygun(data) {
    if (!isApiKeyConfigured()) {
      return;
    }

    log('Sending exception data to Raygun:', data);
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

      xhr.onreadystatechange = function() {
        if (xhr.readyState !== 4) {
          return;
        }

        if (xhr.status === 202) {
          sendSavedErrors();
        } else if (_enableOfflineSave && xhr.status !== 403 && xhr.status !== 400) {
          offlineSave(data);
        }
      };

      xhr.onload = function () {
        log('logged error to Raygun');
      };

    } else if (window.XDomainRequest) {
      xhr.ontimeout = function () {
        if (_enableOfflineSave) {
          log('Raygun: saved error locally');
          offlineSave(data);
        }
      };

      xhr.onload = function () {
        log('logged error to Raygun');
        sendSavedErrors();
      };
    }

    xhr.onerror = function () {
      log('failed to log error to Raygun');
    };

    if (!xhr) {
      log('CORS not supported');
      return;
    }

    xhr.send(data);
  }

  window.Raygun = Raygun;
})(window, window.jQuery);

