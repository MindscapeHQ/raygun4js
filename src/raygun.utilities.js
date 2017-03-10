
var raygunUtilityFactory = function (window) {
  
  var rg = {
    Utilities: {
      parseUrl: function(arg, url) {
        function isNumeric(arg) {
          return !isNaN(parseFloat(arg)) && isFinite(arg);
        }

        return (function(arg, url) {
          if (typeof document === 'undefined') {
              return '';
          }
          
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
      },

      getUuid: function () {
          function _p8(s) {
              var p = (Math.random().toString(16) + "000000000").substr(2, 8);
              return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
          }

          return _p8() + _p8(true) + _p8(true) + _p8();
      },

      createCookie: function (name, value, hours) {
          if (Raygun.Utilities.isReactNative()) {
              Raygun.Utilities.indexedDBStorage.setWithExpiry(name, value); // doneCallback?
              return;
          }

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
      },

      readCookie: function (name, doneCallback) {
          if (Raygun.Utilities.isReactNative()) {
              Raygun.Utilities.indexedDBStorage.get(name, doneCallback);

              doneCallback(null, 'none');

              return;
          }
          
          var nameEQ = name + "=";
          var ca = document.cookie.split(';');
          for (var i = 0; i < ca.length; i++) {
              var c = ca[i];
              while (c.charAt(0) === ' ') {
                  c = c.substring(1, c.length);
              }
              if (c.indexOf(nameEQ) === 0) {
                  var cookieValue = c.substring(nameEQ.length, c.length);

                  doneCallback(null, cookieValue);

                  return;
              }
          }

          doneCallback(null, null);
      },

      clearCookie: function (key) {
          if (Raygun.Utilities.isReactNative()) {
              Raygun.Utilities.indexedDBStorage.clear(key);
              return;
          }

          Raygun.Utilities.createCookie(key, '', -1);
      },

      log: function (message, data) {
          if (window.console && window.console.log && Raygun.Options._debugMode) {
              window.console.log(message);

              if (data) {
                  window.console.log(data);
              }
          }
      },


      isApiKeyConfigured: function () {
          if (Raygun.Options._raygunApiKey && Raygun.Options._raygunApiKey !== '') {
              return true;
          }
          Raygun.Utilities.log("Raygun API key has not been configured, make sure you call Raygun.init(yourApiKey)");
          return false;
      },
      
      isReactNative: function () {
        // TODO: Check more state here
        return typeof document === 'undefined';
      },

      localStorageAvailable: function () {
          try {
              return ('localStorage' in window) && window['localStorage'] !== null;
          } catch (e) {
              return false;
          }
      },

      truncateURL: function (url) {
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
      },

      merge: function (o1, o2) {
          var a, o3 = {};
          for (a in o1) {
              o3[a] = o1[a];
          }
          for (a in o2) {
              o3[a] = o2[a];
          }
          return o3;
      },

      mergeArray: function (t0, t1) {
          if (t1 != null) {
              return t0.concat(t1);
          }
          return t0;
      },

      forEach: function (set, func) {
          for (var i = 0; i < set.length; i++) {
              func.call(null, i, set[i]);
          }
      },

      isEmpty: function (o) {
          for (var p in o) {
              if (o.hasOwnProperty(p)) {
                  return false;
              }
          }
          return true;
      },

      contains: function (array, obj) {
          var i = array.length;
          while (i--) {
              if (array[i] === obj) {
                  return true;
              }
          }
          return false;
      },

      getRandomInt: function () {
          return Math.floor(Math.random() * 9007199254740993);
      },

      getViewPort: function () {
          if (Raygun.Utilities.isReactNative()) {
              return { width: 'Not available', height: 'Not available' };
          }

          var e = document.documentElement,
              g = document.getElementsByTagName('body')[0],
              x = window.innerWidth || e.clientWidth || g.clientWidth,
              y = window.innerHeight || e.clientHeight || g.clientHeight;
          return {width: x, height: y};
      }

    }
  };
    
  if (!window.Raygun) {
      window.Raygun = rg;
  }
};


raygunUtilityFactory(window);