/**
* Analytics module for user and session tracking
*/
(function (window, Raygun) {

  var _raygunApiUrl = 'http://localhost:3001',
      _raygunApiKey,
      _allowInsecureSubmissions = false,
      _sessionKey = 'raygun4js_sessionid',
      _session,
      log = Raygun._private.log,
      createCookie = Raygun._private.createCookie,
      readCookie = Raygun._private.readCookie,
      clearCookie = Raygun._private.clearCookie,
      getUuid = Raygun._private.getUuid;


  var Analytics = {
    init: function (apikey) {
      _raygunApiKey = apikey;

      return Analytics;
    },

    attach: function ()
    {
      Analytics.start();

      window.onbeforeunload = function () {
        Analytics.end();
      };

      return Analytics;
    },

    start: function () {
      createCookie(_sessionKey, getUuid(), 1);
      _session = readCookie(_sessionKey);

      sendEvent('start', _session);
    },

    heartbeat: function () {
      sendEvent('heartbeat', _session);
    },

    end: function () {
      sendEvent('end');

      clearCookie(_sessionKey);
    }
  };

  function sendEvent (eventName) {
    var url = _raygunApiUrl + '/events?apikey=' + encodeURIComponent(_raygunApiKey);

    var data = {
      'EventData': [{
        'Type': 'session_' + eventName,
        'DeviceId': readCookie('raygun4js_userid'),
        'SessionId': _session,
        'Version': '',
        'Os': '',
        'Timestamp': new Date(),
        'DeviceType': ''
      }]
    };

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

    xhr.onerror = function () {
      log('failed to send event to Raygun');
    };

    if (!xhr) {
      log('CORS not supported');
      return;
    }

    xhr.send(data);
  }

  if (window.Raygun) {
    window.Raygun.Analytics = Analytics;
  }

  window.Raygun._seal();


})(window, window.Raygun);