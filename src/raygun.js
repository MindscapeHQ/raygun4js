/**
 * @prettier
 */

/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2013-2018 Raygun Limited
 * Licensed under the MIT license.
 */

/*globals __DEV__, raygunUtilityFactory, raygunErrorUtilitiesFactory, raygunBreadcrumbsFactory, raygunNetworkTrackingFactory, raygunViewportFactory, raygunCoreWebVitalFactory */


var raygunFactory = function (window, $, undefined) {
  var Raygun = {};
  Raygun.Utilities = raygunUtilityFactory(window, Raygun);
  Raygun.ErrorUtilities = raygunErrorUtilitiesFactory(window, Raygun);
  Raygun.NetworkTracking = raygunNetworkTrackingFactory(window, Raygun);
  Raygun.Breadcrumbs = raygunBreadcrumbsFactory(window, Raygun);
  Raygun.CoreWebVitals = raygunCoreWebVitalFactory(window);
  Raygun.Viewport = raygunViewportFactory(window, document, Raygun);

  // Constants
  var ProviderStates = {
    LOADING: 0,
    READY: 1,
  };

  var _userKey = 'raygun4js-userid';

  // State variables
  var _traceKit = TraceKit,
    _raygun = window.Raygun,
    _debugMode = false,
    _ignoreAjaxAbort = false,
    _ignoreAjaxError = false,
    _enableOfflineSave = false,
    _ignore3rdPartyErrors = false,
    _disableAnonymousUserTracking = false,
    _disableErrorTracking = false,
    _disablePulse = true,
    _wrapAsynchronousCallbacks = false,
    _automaticPerformanceCustomTimings = false,
    _trackCoreWebVitals = true,
    _trackViewportDimensions = true,
    _customData = {},
    _tags = [],
    _user,
    _version,
    _filteredKeys,
    _whitelistedScriptDomains = [],
    _beforeSendCallback,
    _beforeSendRumCallback,
    _groupingKeyCallback,
    _beforeXHRCallback,
    _afterSendCallback,
    _raygunApiUrl = 'https://api.raygun.io',
    _excludedHostnames = null,
    _excludedUserAgents = null,
    _filterScope = 'customData',
    _rum = null,
    _breadcrumbs = new Raygun.Breadcrumbs(),
    _pulseMaxVirtualPageDuration = null,
    _pulseIgnoreUrlCasing = true,
    _providerState = ProviderStates.LOADING,
    _loadedFrom,
    _processExceptionQueue = [],
    _trackEventQueue = [],
    _pulseCustomLoadTimeEnabled = null,
    $document,
    _captureUnhandledRejections = true,
    _setCookieAsSecure = false,
    _clientIp,
    _captureMissingRequests = false,
    detachPromiseRejectionFunction,
    _customEndpointSet = false;

  var rand = Math.random();
  var _publicRaygunFunctions = {
    Rand: rand,
    Options: {},

    noConflict: function () {
      // Because _raygun potentially gets set before other code sets window.Raygun
      // this will potentially overwrite the new Raygun object with undefined
      // Not really much point in restoring undefined so just don't do that
      if (_raygun) {
        window.Raygun = _raygun;
      }
      return Raygun;
    },

    constructNewRaygun: function () {
      var rgInstance = raygunFactory(window, window.jQuery);

      return rgInstance;
    },

    init: function (key, options, customdata) {
      _traceKit.remoteFetching = false;

      this.Options._raygunApiKey = key;

      if (customdata) {
        _customData = customdata;
      }

      if ($) {
        $document = $(document);
      }

      if (options) {
        _ignoreAjaxAbort = options.ignoreAjaxAbort || false;
        _ignoreAjaxError = options.ignoreAjaxError || false;
        _disableAnonymousUserTracking = options.disableAnonymousUserTracking || false;
        _disableErrorTracking = options.disableErrorTracking || false;
        _disablePulse = options.disablePulse === undefined ? true : options.disablePulse;
        _excludedHostnames = options.excludedHostnames || false;
        _excludedUserAgents = options.excludedUserAgents || false;
        _pulseMaxVirtualPageDuration = options.pulseMaxVirtualPageDuration || null;
        _pulseIgnoreUrlCasing = options.pulseIgnoreUrlCasing || false;
        _pulseCustomLoadTimeEnabled = options.pulseCustomLoadTimeEnabled || false;
        _setCookieAsSecure = options.setCookieAsSecure || false;
        _captureMissingRequests = options.captureMissingRequests || false;
        _automaticPerformanceCustomTimings = options.automaticPerformanceCustomTimings || false;
        _trackCoreWebVitals = options.trackCoreWebVitals === undefined ? true : options.trackCoreWebVitals;
        _trackViewportDimensions = options.trackViewportDimensions === undefined ? true : options.trackViewportDimensions;

        if (options.apiUrl) {
          _raygunApiUrl = options.apiUrl;
          _customEndpointSet = true;
        }

        if (typeof options.wrapAsynchronousCallbacks !== 'undefined') {
          _wrapAsynchronousCallbacks = options.wrapAsynchronousCallbacks;
        }

        if (typeof options.captureUnhandledRejections !== 'undefined') {
          _captureUnhandledRejections = options.captureUnhandledRejections;
        }

        if (options.debugMode) {
          _debugMode = options.debugMode;
        }
        this.Options._debugMode = _debugMode;

        if (options.ignore3rdPartyErrors) {
          _ignore3rdPartyErrors = true;
        }

        if (options.apiEndpoint) {
          _raygunApiUrl = options.apiEndpoint;
          _customEndpointSet = true;
        }

        if (options.from) {
          _loadedFrom = options.from;
        }

        if (options.clientIp) {
          _clientIp = options.clientIp;
        }
      }

      ensureUser();

      return Raygun;
    },

    withCustomData: function (customdata) {
      _customData = customdata;
      return Raygun;
    },

    withTags: function (tags) {
      _tags = tags;

      if (_rum !== undefined && _rum !== null) {
        _rum.withTags(tags);
      }

      return Raygun;
    },

    attach: function () {
      if (!Raygun.Utilities.isApiKeyConfigured() || _disableErrorTracking) {
        return Raygun;
      }

      if (window.RaygunObject && window[window.RaygunObject] && window[window.RaygunObject].q) {
        window.onerror = null;
      }

      if (_captureUnhandledRejections) {
        attachPromiseRejectionHandler();
      }

      // Attach React Native's handler in Release mode
      if (Raygun.Utilities.isReactNative()) {
        if (__DEV__ !== true && window.ErrorUtils && window.ErrorUtils.setGlobalHandler) {
          window.ErrorUtils.setGlobalHandler(function (error, fatal) {
            // Calling the defaultReactNativeGlobalHandler in release mode instantly closes the application
            // If an exception is currently being sent it will be lost, this sets our own afterSendCallback
            // to notify us when the error is done sending so we can call the default handler
            var originalAfterSendCallback = _afterSendCallback;
            _afterSendCallback = function () {
              if (typeof originalAfterSendCallback === 'function') {
                originalAfterSendCallback();
              }

              Raygun.Utilities.defaultReactNativeGlobalHandler(error, fatal);
              _afterSendCallback = originalAfterSendCallback;
            };

            TraceKit.report(error);
          });
        }
      }

      _traceKit.report.subscribe(processException);

      if (_wrapAsynchronousCallbacks) {
        _traceKit.extendToAsynchronousCallbacks();
      }

      if ($document && $document.ajaxError && !_ignoreAjaxError) {
        $document.ajaxError(processJQueryAjaxError);
      }

      return Raygun;
    },

    detach: function () {
      _traceKit.report.unsubscribe(processException);
      if ($document) {
        $document.unbind('ajaxError', processJQueryAjaxError);
      }
      if (_captureUnhandledRejections) {
        detachPromiseRejectionHandler();
      }
      return Raygun;
    },

    send: function (ex, customData, tags) {
      if (_disableErrorTracking) {
        Raygun.Utilities.log('Error not sent due to disabled error tracking');
        return Raygun;
      }

      try {
        processException(
          _traceKit.computeStackTrace(ex),
          {
            customData:
              typeof _customData === 'function'
                ? Raygun.Utilities.merge(_customData(), customData)
                : Raygun.Utilities.merge(_customData, customData),
            tags:
              typeof _tags === 'function'
                ? Raygun.Utilities.mergeArray(_tags(), tags)
                : Raygun.Utilities.mergeArray(_tags, tags),
          },
          true,
          ex
        );
      } catch (traceKitException) {
        if (ex !== traceKitException) {
          throw traceKitException;
        }
      }
      return Raygun;
    },

    setUser: function (user, isAnonymous, email, fullName, firstName, uuid) {
      _user = {
        Identifier: user,
      };
      if (typeof isAnonymous === 'boolean') {
        _user['IsAnonymous'] = isAnonymous;
      }
      if (email) {
        _user['Email'] = email;
      }
      if (fullName) {
        _user['FullName'] = fullName;
      }
      if (firstName) {
        _user['FirstName'] = firstName;
      }
      if (uuid) {
        _user['UUID'] = uuid;
      }

      if (_rum !== undefined && _rum !== null) {
        _rum.setUser(_user);
      }

      return Raygun;
    },

    resetAnonymousUser: function () {
      clearStorage();
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
    },

    filterSensitiveData: function (filteredKeys) {
      _filteredKeys = filteredKeys;
      return Raygun;
    },

    setFilterScope: function (scope) {
      if (scope === 'customData' || scope === 'all') {
        _filterScope = scope;
      }
      return Raygun;
    },

    whitelistCrossOriginDomains: function (whitelist) {
      _whitelistedScriptDomains = whitelist;
      return Raygun;
    },

    onBeforeSend: function (callback) {
      _beforeSendCallback = callback;
      return Raygun;
    },

    onBeforeSendRum: function (callback) {
      _beforeSendRumCallback = callback;
      return Raygun;
    },

    groupingKey: function (callback) {
      _groupingKeyCallback = callback;
      return Raygun;
    },

    onBeforeXHR: function (callback) {
      _beforeXHRCallback = callback;
      return Raygun;
    },

    onAfterSend: function (callback) {
      _afterSendCallback = callback;
      return Raygun;
    },

    // Public Pulse functions

    endSession: function () {
      if (Raygun.RealUserMonitoring !== undefined && _rum) {
        _rum.endSession();
      }
    },

    trackEvent: function (type, options) {
      if (_providerState !== ProviderStates.READY) {
        _trackEventQueue.push({ type: type, options: options });
        return;
      }

      if (Raygun.RealUserMonitoring !== undefined && _rum) {
        var parentResource = _rum.parentResource;
        if (type === 'pageView' && options.path) {
          _rum.virtualPageLoaded(options.path);
        } else if (type === 'customTiming') {
          _rum.trackCustomTiming(options.name, options.duration, options.offset, parentResource);
        } else if (type === 'customTimings' && options.timings) {
          _rum.sendCustomTimings(options.timings, parentResource);
        }
      }
    },

    setClientIp: function (ip) {
      _clientIp = ip;
    },
    captureMissingRequests: function (val) {
      if (Raygun.RealUserMonitoring !== undefined && _rum) {
        _rum.captureMissingRequests(val);
      }
    },
    recordBreadcrumb: function () {
      _breadcrumbs.recordBreadcrumb.apply(_breadcrumbs, arguments);
    },
    enableAutoBreadcrumbs: function (type) {
      if (type) {
        _breadcrumbs['enableAutoBreadcrumbs' + type]();
      } else {
        _breadcrumbs.enableAutoBreadcrumbs();
      }
    },
    disableAutoBreadcrumbs: function (type) {
      if (type) {
        _breadcrumbs['disableAutoBreadcrumbs' + type]();
      } else {
        _breadcrumbs.disableAutoBreadcrumbs();
      }
    },
    setBreadcrumbOption: function (option, value) {
      _breadcrumbs.setOption(option, value);
    },
    setBreadcrumbs: function (breadcrumbs) {
      _breadcrumbs = breadcrumbs;
    },
    getBreadcrumbs: function () {
      return _breadcrumbs.all();
    },
  };

  Raygun = Raygun.Utilities.mergeMutate(Raygun, _publicRaygunFunctions);

  function callAfterSend(response) {
    if (typeof _afterSendCallback === 'function') {
      _afterSendCallback(response);
    }
  }

  function ensureUser() {
    if (!_user && !_disableAnonymousUserTracking) {
      getFromStorage(setUserComplete);
    } else {
      bootRaygun();
    }
  }

  function setUserComplete(userId) {
    var userIdentifier = "Unknown";

    if (!userId) {
      userIdentifier = Raygun.Utilities.getUuid();
      saveToStorage(userIdentifier);
    } else {
      userIdentifier = userId;
    }

    Raygun.setUser(userIdentifier, true, null, null, null, userIdentifier);

    bootRaygun();
  }

  // Callback for `unhandledrejection` event.
  function promiseRejectionHandler(event) {
    var error = event.reason;
    if (!error && event.detail && event.detail.reason) {
      error = event.detail.reason;
    }
    if (!(error instanceof Error) && event.reason && event.reason.error) {
      error = event.reason.error;
    }
    if (!error) {
      error = new Error('Unhandled promise rejection');
      // Clear the stacktrace, as we don't want the error to appear to come from raygun4js
      error.stack = null;
    }

    _publicRaygunFunctions.send(error, null, ['UnhandledPromiseRejection']);
  }

  // Install global promise rejection handler.
  function attachPromiseRejectionHandler() {
    detachPromiseRejectionFunction = Raygun.Utilities.addEventHandler(
      window,
      'unhandledrejection',
      promiseRejectionHandler
    );
  }

  // Uninstall global promise rejection handler.
  function detachPromiseRejectionHandler() {
    if (detachPromiseRejectionFunction) {
      detachPromiseRejectionFunction();
    }
  }

  // The final initializing logic is provided as a callback due to async storage methods for user data in React Native
  // The common case executes it immediately due to that data being provided by the cookie synchronously
  // The case when Customers is enabled calls this function when the code sets the user data
  function bootRaygun() {
    if (_providerState === ProviderStates.READY) {
      return;
    }

    _providerState = ProviderStates.READY;

    if (Raygun.RealUserMonitoring !== undefined && !_disablePulse) {
      var startRum = function () {
        _rum = new Raygun.RealUserMonitoring(
          Raygun.Options._raygunApiKey,
          _raygunApiUrl,
          makePostCorsRequest,
          _user,
          _version,
          _tags,
          _excludedHostnames,
          _excludedUserAgents,
          _debugMode,
          _pulseMaxVirtualPageDuration,
          _pulseIgnoreUrlCasing,
          _pulseCustomLoadTimeEnabled,
          _beforeSendRumCallback,
          _setCookieAsSecure,
          _captureMissingRequests,
          _automaticPerformanceCustomTimings,
          _trackCoreWebVitals,
          _trackViewportDimensions
        );
        _rum.attach();
      };

      if (!Raygun.Utilities.isReactNative()) {
        if (_loadedFrom === 'onLoad') {
          startRum();
        } else {
          if (window.addEventListener) {
            window.addEventListener('load', startRum);
          } else {
            window.attachEvent('onload', startRum);
          }
        }
      } else {
        Raygun.Utilities.log('Not enabling RUM because Raygun4JS has detected a React Native environment, see #310 on Github');
      }
    }

    retriggerDelayedCommands();

    sendSavedErrors();
  }

  // We need to delay handled/unhandled send() and trackEvent() calls until the user data callback has returned
  function retriggerDelayedCommands() {
    var i;
    for (i = 0; i < _processExceptionQueue.length; i++) {
      processException(
        _processExceptionQueue[i].stackTrace,
        _processExceptionQueue[i].options,
        _processExceptionQueue[i].userTriggered,
        _processExceptionQueue[i].error
      );
    }

    _processExceptionQueue = [];

    for (i = 0; i < _trackEventQueue.length; i++) {
      _publicRaygunFunctions.trackEvent(_trackEventQueue[i].type, _trackEventQueue[i].options);
    }

    _trackEventQueue = [];
  }

  function offlineSave(url, data) {
    var dateTime = new Date().toJSON();

    try {
      var key =
        'raygunjs+' +
        Raygun.Options._raygunApiKey +
        '=' +
        dateTime +
        '=' +
        Raygun.Utilities.getRandomInt();

      if (typeof localStorage[key] === 'undefined') {
        localStorage[key] = JSON.stringify({ url: url, data: data });
      }
    } catch (e) {
      Raygun.Utilities.log('Raygun4JS: LocalStorage full, cannot save exception');
    }
  }

  function sendSavedErrors() {
    if (Raygun.Utilities.localStorageAvailable()) {
      for (var key in localStorage) {
        if (key.indexOf('raygunjs+' + Raygun.Options._raygunApiKey) > -1) {
          try {
            var payload = JSON.parse(localStorage[key]);

            // If the url contains 'raygun.com', replace it with 'raygun.io', but only if not custom set already (proxy, testing, etc)
            if (!_customEndpointSet && payload.url.includes('raygun.com')) {
              payload.url = payload.url.replace('raygun.com', 'raygun.io');
            }

            makePostCorsRequest(payload.url, payload.data);
          } catch (e) {
            Raygun.Utilities.log('Raygun4JS: Invalid JSON object in LocalStorage');
          }

          try {
            localStorage.removeItem(key);
          } catch (e) {
            Raygun.Utilities.log('Raygun4JS: Unable to remove error');
          }
        }
      }
    }
  }

  function filterValue(key, value) {
    if (_filteredKeys) {
      for (var i = 0; i < _filteredKeys.length; i++) {
        if (typeof _filteredKeys[i] === 'object' && typeof _filteredKeys[i].exec === 'function') {
          var executedFilter = _filteredKeys[i].exec(key);

          if (executedFilter !== null && executedFilter !== undefined) {
            return '[removed by filter]';
          }
        } else if (_filteredKeys[i] === key) {
          return '[removed by filter]';
        }
      }
    }

    return value;
  }

  function filterObject(reference, parentKey) {
    if (reference == null) {
      return reference;
    }

    if (Object.prototype.toString.call(reference) !== '[object Object]') {
      return reference;
    }

    var filteredObject = {};

    for (var propertyName in reference) {
      var propertyValue = reference[propertyName];

      if (Object.prototype.toString.call(propertyValue) === '[object Object]') {
        if (parentKey !== 'Details' || propertyName !== 'Client') {
          filteredObject[propertyName] = filterObject(
            filterValue(propertyName, propertyValue),
            propertyName
          );
        } else {
          filteredObject[propertyName] = propertyValue;
        }
      } else if (Object.prototype.toString.call(propertyValue) !== '[object Function]') {
        if (typeof parentKey !== 'undefined') {
          filteredObject[propertyName] = filterValue(propertyName, propertyValue);
        } else if (propertyName === 'OccurredOn') {
          filteredObject[propertyName] = propertyValue;
        }
      }
    }

    return filteredObject;
  }

  function processJQueryAjaxError(event, jqXHR, ajaxSettings, thrownError) {
    var message =
      'AJAX Error: ' +
      (jqXHR.statusText || 'unknown') +
      ' ' +
      (ajaxSettings.type || 'unknown') +
      ' ' +
      (Raygun.Utilities.truncateURL(ajaxSettings.url) || 'unknown');

    // ignore ajax abort if set in the options
    if (_ignoreAjaxAbort) {
      if (jqXHR.status === 0 || !jqXHR.getAllResponseHeaders()) {
        return;
      }
    }

    Raygun.send(thrownError || event.type, {
      status: jqXHR.status,
      statusText: jqXHR.statusText,
      type: ajaxSettings.type,
      url: ajaxSettings.url,
      ajaxErrorMessage: message,
      contentType: ajaxSettings.contentType,
      requestData:
        ajaxSettings.data && ajaxSettings.data.slice
          ? ajaxSettings.data.slice(0, 10240)
          : undefined,
      responseData:
        jqXHR.responseText && jqXHR.responseText.slice
          ? jqXHR.responseText.slice(0, 10240)
          : undefined,
      activeTarget:
        event.target &&
          event.target.activeElement &&
          event.target.activeElement.outerHTML &&
          event.target.activeElement.outerHTML.slice
          ? event.target.activeElement.outerHTML.slice(0, 10240)
          : undefined,
    });
  }

  function processException(stackTrace, options, userTriggered, error) {
    if (_providerState !== ProviderStates.READY) {
      _processExceptionQueue.push({
        stackTrace: stackTrace,
        options: options,
        userTriggered: userTriggered,
        error: error,
      });
      return;
    }

    var scriptError = 'Script error';

    var stack = [],
      qs = {};

    if (_ignore3rdPartyErrors && shouldDiscardThirdPartyError(stackTrace, options)) {
      return;
    }

    if (_excludedHostnames instanceof Array) {
      for (var hostIndex in _excludedHostnames) {
        if (_excludedHostnames.hasOwnProperty(hostIndex)) {
          if (
            window.location.hostname &&
            window.location.hostname.match(_excludedHostnames[hostIndex])
          ) {
            Raygun.Utilities.log(
              'Raygun4JS: cancelling send as error originates from an excluded hostname'
            );

            return;
          }
        }
      }
    }

    if (_excludedUserAgents instanceof Array && !Raygun.Utilities.isReactNative()) {
      for (var userAgentIndex in _excludedUserAgents) {
        if (_excludedUserAgents.hasOwnProperty(userAgentIndex)) {
          if (window.raygunUserAgent.match(_excludedUserAgents[userAgentIndex])) {
            Raygun.Utilities.log(
              'Raygun4JS: cancelling send as error originates from an excluded user agent'
            );

            return;
          }
        }
      }
    }

    if (
      !Raygun.Utilities.isReactNative() &&
      window.raygunUserAgent.match('RaygunPulseInsightsCrawler')
    ) {
      return;
    }

    if (stackTrace.stack && stackTrace.stack.length) {
      Raygun.Utilities.forEach(stackTrace.stack, function (i, frame) {
        stack.push({
          LineNumber: frame.line,
          ColumnNumber: frame.column,
          ClassName: 'line ' + frame.line + ', column ' + frame.column,
          FileName: frame.url,
          MethodName: frame.func || '[anonymous]',
        });
      });
    }

    var queryString = Raygun.Utilities.parseUrl('?');

    if (queryString.length > 0) {
      Raygun.Utilities.forEach(queryString.split('&'), function (i, segment) {
        var parts = segment.split('=');
        if (parts && parts.length === 2) {
          var key = decodeURIComponent(parts[0]);
          var value = filterValue(key, parts[1]);

          qs[key] = value;
        }
      });
    }

    if (options === undefined) {
      options = {};
    }

    if (Raygun.Utilities.isEmpty(options.customData)) {
      if (typeof _customData === 'function') {
        options.customData = _customData();
      } else {
        options.customData = _customData;
      }
    }

    if (Raygun.Utilities.isEmpty(options.tags)) {
      if (typeof _tags === 'function') {
        options.tags = _tags();
      } else if (typeof _tags === 'string') {
        options.tags = [_tags];
      } else {
        options.tags = _tags;
      }
    }

    if (!userTriggered) {
      if (!options.tags) {
        options.tags = [];
      }

      if (!Raygun.Utilities.contains(options.tags, 'UnhandledException')) {
        options.tags.push('UnhandledException');
      }
    }

    if (
      Raygun.Utilities.isReactNative() &&
      !Raygun.Utilities.contains(options.tags, 'React Native')
    ) {
      options.tags.push('React Native');
    }

    var viewportDimensions = Raygun.Viewport.getViewportDimensions();

    var screenData = window.screen || {
      width: viewportDimensions.width,
      height: viewportDimensions.height,
      colorDepth: 8,
    };

    var custom_message = options.customData && options.customData.ajaxErrorMessage;

    var finalCustomData;
    if (_filterScope === 'customData') {
      finalCustomData = filterObject(options.customData, 'UserCustomData');
    } else {
      finalCustomData = options.customData;
    }

    try {
      JSON.stringify(finalCustomData);
    } catch (e) {
      var m = 'Cannot add custom data; may contain circular reference';
      finalCustomData = { error: m };
      Raygun.Utilities.log('Raygun4JS: ' + m);
    }

    var finalMessage = scriptError;
    if (custom_message) {
      finalMessage = custom_message;
    } else if (stackTrace.message) {
      finalMessage = stackTrace.message;
    } else if (options && options.status) {
      finalMessage = options.status;
    } else if (typeof error === 'string') {
      finalMessage = error;
    }

    if (typeof finalMessage === 'undefined') {
      finalMessage = scriptError;
    }

    if (finalMessage && typeof finalMessage === 'string') {
      finalMessage = finalMessage.substring(0, 512);
    }

    var pageLocation;
    if (!Raygun.Utilities.isReactNative()) {
      pageLocation = [
        location.protocol,
        '//',
        location.host,
        location.pathname,
        location.hash,
      ].join('');
    } else {
      pageLocation = '/';
    }

    var payload = {
      OccurredOn: new Date(),
      Details: {
        Error: {
          ClassName: stackTrace.name,
          Message: finalMessage,
          StackTrace: stack,
          StackString: stackTrace.stackstring,
        },
        Environment: {
          UtcOffset: new Date().getTimezoneOffset() / -60.0,
          'User-Language': navigator.userLanguage,
          'Document-Mode': !Raygun.Utilities.isReactNative()
            ? document.documentMode
            : 'Not available',
          'Browser-Width': viewportDimensions.width,
          'Browser-Height': viewportDimensions.height,
          'Screen-Width': screenData.width,
          'Screen-Height': screenData.height,
          'Color-Depth': screenData.colorDepth,
          Browser: navigator.appCodeName,
          'Browser-Name': navigator.appName,
          'Browser-Version': navigator.appVersion,
          Platform: navigator.platform,
        },
        Client: {
          Name: 'raygun-js',
          Version: '{{VERSION}}',
        },
        UserCustomData: finalCustomData,
        Tags: options.tags,
        Request: {
          Url: pageLocation,
          QueryString: qs,
          Headers: {
            'User-Agent': window.raygunUserAgent,
            Referer: !Raygun.Utilities.isReactNative() ? document.referrer : 'Not available',
            Host: !Raygun.Utilities.isReactNative() ? document.domain : 'Not available',
          },
        },
        Version: _version || 'Not supplied',
      },
    };

    payload.Details.User = _user;

    if (_breadcrumbs.any()) {
      payload.Details.Breadcrumbs = [];
      var crumbs = _breadcrumbs.all() || [];

      crumbs.forEach(function (crumb) {
        if (crumb.metadata) {
          crumb.CustomData = crumb.metadata;
          delete crumb.metadata;
        }

        payload.Details.Breadcrumbs.push(crumb);
      });
    }

    if (_filterScope === 'all') {
      payload = filterObject(payload);
    }

    if (typeof _groupingKeyCallback === 'function') {
      Raygun.Utilities.log('Raygun4JS: calling custom grouping key');
      payload.Details.GroupingKey = _groupingKeyCallback(payload, stackTrace, options);
    }

    var clonedPayload = payload;

    if (typeof _beforeSendCallback === 'function') {

      try {
        clonedPayload = (!!window.structuredClone ? window.structuredClone(payload) : payload); //clone in supported browsers (everything but IE)
      } catch (e) {
        Raygun.Utilities.log('Unable to clone RUM payload data":', e);
      }

      var mutatedPayload = _beforeSendCallback(clonedPayload);

      if (mutatedPayload) {
        sendToRaygun(mutatedPayload);
      }
    } else {
      sendToRaygun(clonedPayload);
    }
  }

  function sendToRaygun(data) {
    if (!Raygun.Utilities.isApiKeyConfigured()) {
      return;
    }

    Raygun.Utilities.log('Sending exception data to Raygun:', data);
    var url = _raygunApiUrl + '/entries?apikey=' + encodeURIComponent(Raygun.Options._raygunApiKey);
    makePostCorsRequest(url, JSON.stringify(data));
  }

  // Create the XHR object.
  function createCORSRequest(method, url) {
    var xhr = new window.XMLHttpRequest();
    xhr.timeout = 10000;

    if ('withCredentials' in xhr || Raygun.Utilities.isReactNative()) {
      // XHR for Chrome/Firefox/Opera/Safari
      // as well as React Native's custom XHR implementation
      xhr.open(method, url, true);
    }

    return xhr;
  }

  // Make the actual CORS request.
  function makePostCorsRequest(url, data, _successCallback, _errorCallback) {
    var xhr = createCORSRequest('POST', url, data);
    if (typeof xhr.setRequestHeader === 'function') {
      xhr.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');

      if (typeof _clientIp !== "undefined") {
        xhr.setRequestHeader('X-Remote-Address', _clientIp);
      }
    }

    if (typeof _beforeXHRCallback === 'function') {
      _beforeXHRCallback(xhr);
    }

    Raygun.Utilities.log('Is offline enabled? ' + _enableOfflineSave);

    // For some reason this check is false in React Native but these handlers still need to be attached
    if ('withCredentials' in xhr || Raygun.Utilities.isReactNative()) {
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) {
          return;
        }

        if (xhr.status === 202) {
          sendSavedErrors();
        } else if (
          _enableOfflineSave &&
          xhr.status !== 403 &&
          xhr.status !== 400 &&
          xhr.status !== 429
        ) {
          offlineSave(url, data);
        }
      };

      xhr.onload = function () {
        Raygun.Utilities.log('posted to Raygun');

        callAfterSend(this);

        if (_successCallback && typeof _successCallback === 'function') {
          _successCallback(xhr, url, data);
        }
      };
    }



    xhr.onerror = function () {
      Raygun.Utilities.log('failed to post to Raygun');

      callAfterSend(this);

      if (_errorCallback && typeof _errorCallback === 'function') {
        _errorCallback(xhr, url, data);
      }
    };

    if (!xhr) {
      Raygun.Utilities.log('CORS not supported');
      return;
    }

    // Old versions of RN fail to send errors without this
    if (Raygun.Utilities.isReactNative()) {
      xhr.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
    }

    xhr.send(data);
  }

  // Storage
  function saveToStorage(value) {
    if (Raygun.Utilities.localStorageAvailable()) {
      localStorage.setItem(_userKey, value);
    } else {
      Raygun.Utilities.createCookie(_userKey, value, 24 * 31, _setCookieAsSecure);
    }
  }

  function clearStorage() {
    if (Raygun.Utilities.localStorageAvailable()) {
      localStorage.removeItem(_userKey);
    } else {
      Raygun.Utilities.clearCookie(_userKey);
    }
  }

  function getFromStorage(callback) {
    /**
     * Attempt to get the value from local storage,
     * If that doesn't contain a value then try from a cookie as previous versions saved it here
     */
    var value;
    if (Raygun.Utilities.localStorageAvailable()) {
      value = localStorage.getItem(_userKey);

      if (value !== null) {
        callback(value);
        return;
      }
    }

    value = Raygun.Utilities.readCookie(_userKey);

    /**
     * If there was a cookie and localStorage is avaliable then
     * clear the cookie as localStorage will be the storage mechanism going forward
     */
    if (value !== null && Raygun.Utilities.localStorageAvailable()) {
      Raygun.Utilities.clearCookie(_userKey);
      localStorage.setItem(_userKey, value);
    }

    callback(value);
  }

  function shouldDiscardThirdPartyError(stackTrace, options) {
    if (Raygun.Utilities.isEmpty(stackTrace.stack)) {
      Raygun.Utilities.log('Raygun4JS: Cancelling send due to null stacktrace');
      return true;
    }

    if (Raygun.ErrorUtilities.isScriptError(stackTrace, options)) {
      Raygun.Utilities.log(
        'Raygun4JS: cancelling send due to third-party script error with no stacktrace and message',
        {
          stackTrace: stackTrace,
          options: options
        }
      );
      return true;
    }

    if (Raygun.ErrorUtilities.isBrowserExtensionError(stackTrace)) {
      Raygun.Utilities.log(
        'Raygun4JS: cancelling send due to the error coming from a browser extension',
        stackTrace
      );
      return true;
    }

    if (!Raygun.ErrorUtilities.isValidStackTrace(stackTrace)) {
      Raygun.Utilities.log(
        'Raygun4JS: cancelling send due to invalid stacktrace data',
        stackTrace
      );
      return true;
    }

    if (!Raygun.ErrorUtilities.stackTraceHasValidDomain(stackTrace, _whitelistedScriptDomains)) {
      Raygun.Utilities.log(
        'Raygun4JS: cancelling send due to error on non-origin, non-whitelisted domain'
      );

      return true;
    }

    return false;
  }

  if (!window.__raygunNoConflict) {
    window.Raygun = Raygun;
  }
  TraceKit.setRaygun(Raygun);

  return Raygun;
};

window.__instantiatedRaygun = raygunFactory(window, window.jQuery);
