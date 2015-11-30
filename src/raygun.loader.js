(function (window, Raygun) {
  if (!window['RaygunObject'] || !window[window['RaygunObject']]) {
    return;
  }

  var snippetOptions = window[window['RaygunObject']].o;
  var errorQueue,
    apiKey,
    options,
    attach,
    enablePulse;

  errorQueue = window[window['RaygunObject']].q;

  var executor = function (pair) {
    var key = pair[0];
    var value = pair[1];

    if (key && value) {
      switch (key) {
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
        case 'setUser':
          Raygun.setUser(value.identifier, value.isAnonymous, value.email, value.fullName, value.firstName, value.uuid);
          break;
        case 'onBeforeSend':
          Raygun.onBeforeSend(value);
          break;
        case 'withCustomData':
          Raygun.withCustomData(value);
          break;
        case 'withTags':
          Raygun.withTags(value);
          break;
        case 'setVersion':
          Raygun.setVersion(value);
          break;
        case 'filterSensitiveData':
          Raygun.filterSensitiveData(value);
          break;
        case 'setFilterScope':
          Raygun.setFilterScope(value);
          break;
        case 'whitelistCrossOriginDomains':
          Raygun.whitelistCrossOriginDomains(value);
          break;
        case 'saveIfOffline':
          if (typeof value === 'boolean') {
            Raygun.saveIfOffline(value);
          }
          break;
        case 'groupingKey':
          Raygun.groupingKey(value);
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
    if (apiKey) {
      if (!options) {
        options = {};
      }

      if (enablePulse) {
        options.disablePulse = false;
      }

      options.from = 'onLoad';
      Raygun.init(apiKey, options, null);
    }

    if (attach) {
      Raygun.attach();

      errorQueue = window[window['RaygunObject']].q;
      for (var j in errorQueue) {
        Raygun.send(errorQueue[j].e, { handler: 'From Raygun4JS snippet global error handler' });
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
    executor(arguments);
  };
  window[window['RaygunObject']].q = errorQueue;

})(window, window.Raygun);