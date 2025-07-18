/**
 * @prettier
 */

(function (window, Raygun) {
  if (!window['RaygunObject'] || !window[window['RaygunObject']]) {
    return;
  }

  var snippetOptions = window[window['RaygunObject']].o;
  var hasLoaded = false,
    globalExecutorInstalled = false,
    errorQueue,
    delayedCommands = [],
    apiKey,
    options,
    noConflict,
    realUserMonitoringEnabled = false,
    crashReportingEnabled = false,
    captureUnhandledRejections;

  var hasSessionStorage = false;
  try {
    hasSessionStorage = !!window.sessionStorage;
  } catch (e) {
    // sessionStorage not available
  }

  var snippetOnErrorSignature = ['function (b,c,d,f,g){', '||(g=new Error(b)),a[e].q=a[e].q||[]'];

  errorQueue = window[window['RaygunObject']].q;
  var rg = Raygun;

  var delayedExecutionFunctions = [
    'trackEvent',
    'send',
    'recordBreadcrumb',
    'captureMissingRequests',
  ];

  var parseSnippetOptions = function () {
    snippetOptions = window[window['RaygunObject']].o;

    for (var i in snippetOptions) {
      if (snippetOptions.hasOwnProperty(i)) {
        var pair = snippetOptions[i];
        if (pair) {
          if (delayedExecutionFunctions.indexOf(pair[0]) === -1) {
            // Config pair, can execute immediately
            executor(pair);
          } else {
            // Action (posting) pair which requires lib to be fully parsed, delay till after Raygun obj has been init'd
            delayedCommands.push(pair);
          }
        }
      }
    }
  };

  var executor = function (pair) {
    var key = pair[0];
    var value = pair[1];

    if (key) {
      switch (key) {
        // React Native only
        case 'boot':
          onLoadHandler();
          break;
        // Immediate execution config functions
        case 'noConflict':
          noConflict = value;
          break;
        case 'apiKey':
          apiKey = value;
          hasLoaded = true;
          break;
        case 'options':
          options = value;
          break;
        case 'attach':
        case 'enableCrashReporting':
          crashReportingEnabled = value;
          hasLoaded = true;
          break;
        case 'enableRealUserMonitoring':
        case 'enableRUM':
        case 'enablePulse':
          realUserMonitoringEnabled = value;
          hasLoaded = true;
          break;
        case 'detach':
          rg.detach();
          break;
        case 'getRaygunInstance':
          if (value && typeof value === 'function') {
            value(rg);
          }

          return rg;
        case 'setUser':
          rg.setUser(
            value.identifier,
            value.isAnonymous,
            value.email,
            value.fullName,
            value.firstName,
            value.uuid
          );
          break;
        case 'onBeforeSend':
          rg.onBeforeSend(value);
          break;
        case 'onBeforeSendRUM':
          rg.onBeforeSendRum(value);
          break;
        case 'onBeforeXHR':
          rg.onBeforeXHR(value);
          break;
        case 'onAfterSend':
          rg.onAfterSend(value);
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
        case 'endSession':
          rg.endSession();
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
          } else if (value.type && value.name && value.duration) {
            rg.trackEvent(value.type, {
              name: value.name,
              duration: value.duration,
              offset: value.offset || 0,
            });
          } else if (value.type && value.timings) {
            rg.trackEvent(value.type, { timings: value.timings });
          }
          break;
        case 'recordBreadcrumb':
          rg.recordBreadcrumb(pair[1], pair[2]);
          break;
        case 'enableAutoBreadcrumbs':
          rg.enableAutoBreadcrumbs();
          break;
        case 'disableAutoBreadcrumbs':
          rg.disableAutoBreadcrumbs();
          break;
        case 'enableAutoBreadcrumbsConsole':
          rg.enableAutoBreadcrumbs('Console');
          break;
        case 'disableAutoBreadcrumbsConsole':
          rg.disableAutoBreadcrumbs('Console');
          break;
        case 'enableAutoBreadcrumbsNavigation':
          rg.enableAutoBreadcrumbs('Navigation');
          break;
        case 'disableAutoBreadcrumbsNavigation':
          rg.disableAutoBreadcrumbs('Navigation');
          break;
        case 'enableAutoBreadcrumbsClicks':
          rg.enableAutoBreadcrumbs('Clicks');
          break;
        case 'disableAutoBreadcrumbsClicks':
          rg.disableAutoBreadcrumbs('Clicks');
          break;
        case 'enableAutoBreadcrumbsXHR':
          rg.enableAutoBreadcrumbs('XHR');
          break;
        case 'disableAutoBreadcrumbsXHR':
          rg.disableAutoBreadcrumbs('XHR');
          break;
        case 'setBreadcrumbLevel':
          rg.setBreadcrumbOption('breadcrumbsLevel', pair[1]);
          break;
        case 'setAutoBreadcrumbsXHRIgnoredHosts':
          rg.setBreadcrumbOption('xhrIgnoredHosts', pair[1]);
          break;
        case 'logContentsOfXhrCalls':
          rg.setBreadcrumbOption('logXhrContents', pair[1]);
          break;
        case 'clientIp':
          rg.setClientIp(value);
          break;
        case 'captureMissingRequests':
          rg.captureMissingRequests(value);
          break;
        case 'captureUnhandledRejections':
          captureUnhandledRejections = value;
          break;
      }
    }
  };

  var installGlobalExecutor = function () {
    window[window['RaygunObject']] = function () {
      return executor(arguments);
    };
    window['RaygunInitialized'] = true;
    globalExecutorInstalled = true;
  };

  var onLoadHandler = function () {
    parseSnippetOptions();

    if (noConflict) {
      rg = Raygun.noConflict();
    }

    if (apiKey) {
      if (!options) {
        options = {};
      }

      if (realUserMonitoringEnabled) {
        options.disablePulse = false;
      }

      options.from = 'onLoad';
      rg.init(apiKey, options, null);
    }

    if (crashReportingEnabled) {
      rg.attach();

      errorQueue = window[window['RaygunObject']].q;
      for (var j in errorQueue) {
        rg.send(errorQueue[j].e, { handler: 'From Raygun4JS snippet global error handler' });
      }
    } else if (typeof window.onerror === 'function') {
      var onerrorSignature = window.onerror.toString();
      if (
        onerrorSignature.indexOf(snippetOnErrorSignature[0]) !== -1 &&
        onerrorSignature.indexOf(snippetOnErrorSignature[1]) !== -1
      ) {
        window.onerror = null;
      }
    }

    for (var commandIndex in delayedCommands) {
      if (delayedCommands.hasOwnProperty(commandIndex)) {
        executor(delayedCommands[commandIndex]);
      }
    }

    delayedCommands = [];

    if (!globalExecutorInstalled) {
      installGlobalExecutor();
    }

    window[window['RaygunObject']].q = errorQueue;
  };

  if (!Raygun.Utilities.isReactNative()) {
    var supportsNavigationTiming =
      !!window.PerformanceObserver &&
      !!window.PerformanceObserver.supportedEntryTypes &&
      window.PerformanceObserver.supportedEntryTypes.includes('navigation');
    if (document.readyState === 'complete') {
      onLoadHandler();
    } else if (supportsNavigationTiming) {
      //The other 'load' events are called before the PerformanceNavigationTiming is completed resulting in `loadEventEnd` never being set which is needed to calculate the duration of the timing. This observer triggers after the timing is complete.
      var observer = new window.PerformanceObserver(function () {
        onLoadHandler();
      });

      observer.observe({ entryTypes: ['navigation'] });
    } else if (window.addEventListener) {
      window.addEventListener('load', onLoadHandler);
    } else {
      window.attachEvent('onload', onLoadHandler);
    }
  } else {
    // Special case for React Native: set up the executor immediately,
    // then a manual rg4js('boot') call will trigger onLoadHandler, as the above events aren't available
    installGlobalExecutor();
  }
})(window, window.__instantiatedRaygun);

try {
  delete window.__instantiatedRaygun;
} catch (e) {
  window['__instantiatedRaygun'] = undefined;
}
