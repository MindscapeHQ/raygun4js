(function (window, Raygun) {
  if (!window['RaygunObject'] || !window[window['RaygunObject']]) {
    return;
  }

  var snippetOptions = window[window['RaygunObject']].o;
  var errorQueue,
    delayedCommands = [],
    apiKey,
    options,
    attach,
    enablePulse,
    noConflict;

  errorQueue = window[window['RaygunObject']].q;
  var rg = Raygun;

  var delayedExecutionFunctions = ['trackEvent', 'send'];

  var executor = function (pair) {
    var key = pair[0];
    var value = pair[1];

    if (key) {
      switch (key) {
        // Immediate execution config functions
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
        case 'onBeforeXHR':
          rg.onBeforeXHR(value);
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

        // Delayed execution functions
        case 'send':
          var error, tags, customData;
          if (value.error) {
            error = value.error;

            if (value.tags) {
              tags = value.tags;
            }
            if (value.customData) {
              customData = value.customData;
            }
          } else {
            error = value;
          }
          rg.send(error, customData, tags);
          break;
        case 'trackEvent':
          if (value.type && value.path) {
            rg.trackEvent(value.type, { path: value.path });
          }
          break;
      }
    }
  };

  for (var i in snippetOptions) {
    var pair = snippetOptions[i];
    if (pair) {
      if (delayedExecutionFunctions.indexOf(pair[0]) === -1) { // Config pair, can execute immediately
        executor(pair);
      } else { // Pair which requires lib to be fully parsed, delay till onload
        delayedCommands.push(pair);
      }
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

    for (var commandIndex in delayedCommands) {
      executor(delayedCommands[commandIndex]);
    }

    delayedCommands = [];

    window[window['RaygunObject']] = function () {
      return executor(arguments);
    };
    window[window['RaygunObject']].q = errorQueue;
  };

  if (document.readyState === 'complete') {
    onLoadHandler();
  } else if (window.addEventListener) {
    window.addEventListener('load', onLoadHandler);
  } else {
    window.attachEvent('onload', onLoadHandler);
  }

})(window, window.__instantiatedRaygun);

try 
{ 
    delete window.__instantiatedRaygun;
} 
catch(e) 
{ 
    window["__instantiatedRaygun"] = undefined; 
}