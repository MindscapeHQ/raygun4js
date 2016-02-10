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