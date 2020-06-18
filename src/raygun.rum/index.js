/**
 * @prettier
 */

/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2018 MindscapeHQ
 * Licensed under the MIT license.
 */

var raygunRumFactory = function(window, $, Raygun) {
  Raygun.RealUserMonitoring = function(
    apiKey,
    apiUrl,
    makePostCorsRequest,
    user,
    version,
    tags,
    excludedHostNames,
    excludedUserAgents,
    debugMode,
    maxVirtualPageDuration,
    ignoreUrlCasing,
    customTimingsEnabled,
    beforeSendCb,
    setCookieAsSecure,
    captureMissingRequests,
    automaticPerformanceCustomTimings
  ) {
    var self = this;
    var _private = {};

    this.cookieName = 'raygun4js-sid';
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.debugMode = debugMode;
    this.excludedHostNames = excludedHostNames;
    this.excludedUserAgents = excludedUserAgents;
    this.maxVirtualPageDuration = maxVirtualPageDuration || 1800000; // 30 minutes
    this.ignoreUrlCasing = ignoreUrlCasing;
    /**
     * Note: the `customTimingsEnabled` flag is for tracking legacy custom timings
     * because that api prevents page timings from being sent until the main request is completed
     */
    this.customTimingsEnabled = customTimingsEnabled; 
    this.automaticPerformanceCustomTimings = automaticPerformanceCustomTimings;
    this.beforeSend =
      beforeSendCb ||
      function(payload) {
        return payload;
      };

    this.pendingPayloadData = customTimingsEnabled || false;
    this.queuedPerformanceTimings = [];
    this.pendingVirtualPage = null;

    this.sessionId = null;
    this.virtualPage = null;
    this.user = user;
    this.version = version;
    this.tags = tags;
    this.heartBeatInterval = null;
    this.heartBeatIntervalTime = 30000;
    this.offset = 0;
    this._captureMissingRequests = captureMissingRequests || false;
    this.pageIsUnloading = false;

    this.queuedItems = [];
    this.maxQueueItemsSent = 50;
    this.setCookieAsSecure = setCookieAsSecure;

    this.xhrRequestMap = {};
    this.xhrStatusMap = {};

    var Timings = {
      Page: 'p',
      VirtualPage: 'v',
      XHR: 'x',
      CachedChildAsset: 'e',
      ChildAsset: 'c',
      CustomTiming: 't'
    };

    this.Utilities = {};

    // ================================================================================
    // =                                                                              =
    // =                                 Public Api                                   =
    // =                                                                              =
    // ================================================================================

    this.attach = function() {
      getSessionId(function(isNewSession) {
        self.pageLoaded(isNewSession);
      });

      var clickHandler = function() {
        this.updateStorageTimestamp();
      }.bind(_private);

      var unloadHandler = function() {
        self.pageIsUnloading = true;
        sendChildAssets(true);
        sendQueuedItems();
      }.bind(_private);

      var visibilityChangeHandler = function() {
        if (document.visibilityState === 'visible') {
          this.updateStorageTimestamp();
        }
      }.bind(_private);

      if (window.addEventListener) {
        window.addEventListener('click', clickHandler);
        document.addEventListener('visibilitychange', visibilityChangeHandler);
        window.addEventListener('beforeunload', unloadHandler);
      } else if (window.attachEvent) {
        document.attachEvent('onclick', clickHandler);
      }

      Raygun.NetworkTracking.on('request', xhrRequestHandler.bind(this));
      Raygun.NetworkTracking.on('error', xhrErrorHandler.bind(this));
      Raygun.NetworkTracking.on('response', xhrResponseHandler.bind(this));
    };

    this.pageLoaded = function(isNewSession) {
      // Only create a session if we don't have one.
      if (isNewSession) {
        sendNewSessionStart();
      }

      sendPerformance(true);

      heartBeat();

      self.initalStaticPageLoadTimestamp = getPerformanceNow(0);
    };

    this.virtualPageLoaded = function(path) {
      if (typeof path === 'string') {
        if (path.length > 0 && path[0] !== '/') {
          path = path + '/';
        }

        if (path.length > 800) {
          path = path.substring(0, 800);
        }

        this.virtualPage = path;
      }

      processVirtualPageTimingsInQueue();
      sendPerformance(false);
    };

    this.setUser = function(user) {
      self.user = user;
    };

    this.withTags = function(tags) {
      self.tags = tags;
    };

    this.endSession = function() {
      self.pendingPayloadData = false;
      sendQueuedPerformancePayloads();
      
      sendItemImmediately({
        sessionId: self.sessionId,
        requestId: self.requestId,
        timestamp: new Date().toISOString(),	
        type: 'session_end',	
      });

      generateNewSessionId();

      sendNewSessionStart();
    };

    this.sendCustomTimings = function(customTimings) {
      if (
        typeof customTimings === 'object' &&
        (typeof customTimings.custom1 === 'number' ||
          typeof customTimings.custom2 === 'number' ||
          typeof customTimings.custom3 === 'number' ||
          typeof customTimings.custom4 === 'number' ||
          typeof customTimings.custom5 === 'number' ||
          typeof customTimings.custom6 === 'number' ||
          typeof customTimings.custom7 === 'number' ||
          typeof customTimings.custom8 === 'number' ||
          typeof customTimings.custom9 === 'number' ||
          typeof customTimings.custom10 === 'number')
      ) {
        if (self.pendingPayloadData && self.queuedPerformanceTimings.length > 0) {
          // Append custom timings to first queued item, which should be a page view
          self.pendingPayloadData = false;
          self.queuedPerformanceTimings[0].customTiming = customTimings;
          sendQueuedPerformancePayloads();
        }
      }
    };

    this.trackCustomTiming = function(name, duration, offset) {
      if(typeof duration === "number") {
        var newTimings = [];
        newTimings.push(createCustomTimingMeasurement(name, duration, offset));
        addPerformanceTimingsToQueue(newTimings, false);
      } else {
        log('Raygun4JS: Custom timing "' + name + '" duration value is not a number');
      }
    };

    this.captureMissingRequests = function(val) {
      this._captureMissingRequests = val;
    };

    // ================================================================================
    // =                                                                              =
    // =                              Session Management                              =
    // =                                                                              =
    // ================================================================================

    function heartBeat() {
      if (self.heartBeatInterval !== null) {
        log('Raygun4JS: Heartbeat already exists. Skipping heartbeat creation.');
        return;
      }

      self.heartBeatInterval = setInterval(function() {
        sendChildAssets();
        sendQueuedItems();
      }, self.heartBeatIntervalTime); // 30 seconds between heartbeats
    }

    function sendNewSessionStart() {
      sendItemImmediately({
        sessionId: self.sessionId,
        timestamp: new Date().toISOString(),
        type: 'session_start',
        user: self.user,
        version: self.version || 'Not supplied',
        tags: self.tags,
        device: navigator.userAgent,
      });
    }

    function hasSessionExpired(storageItem) {
      var existingTimestamp = new Date(readStorageElement(storageItem, 'timestamp'));
      var halfHrAgo = new Date(new Date() - 30 * 60000);
      return existingTimestamp < halfHrAgo;
    }

    function getSessionId(callback) {
      var storageItem = getFromStorage();
      var nullValue = storageItem === null;
      var expired = false;

      if(!nullValue) {
        expired = hasSessionExpired(storageItem);
      }
      
      if(nullValue || expired) {
        generateNewSessionId();
        callback(true);
      } else {
        var id = readStorageElement(storageItem, 'id');   
        saveToStorage(id); // Update the timestamp     
        self.sessionId = id;
        callback(false);
      }
    }

    function updateStorageTimestamp() {
      var storageItem = getFromStorage();
      var expired = false;

      if(storageItem) {
        expired = hasSessionExpired(storageItem);
      }
      
      if(expired || !storageItem){
        self.sessionId = randomKey(32);
      }

      saveToStorage(self.sessionId);

      if (expired) {
        sendNewSessionStart();
      }
    }

    function generateNewSessionId(){
      self.sessionId = randomKey(32);
      saveToStorage(self.sessionId);
    }

    // ================================================================================
    // =                                                                              =
    // =                                  Queueing                                    =
    // =                                                                              =
    // ================================================================================

    function sendPerformance(firstLoad) {
      var performanceData = getPerformanceData(self.virtualPage, firstLoad);

      if (performanceData === null || performanceData.length < 0) {
        return;
      }

      addPerformanceTimingsToQueue(performanceData, false);
    }

    function sendChildAssets(forceSend) {
      if (forceSend) {
        processVirtualPageTimingsInQueue();
      }

      var data = [];
      extractChildData(data, undefined, forceSend);
      addPerformanceTimingsToQueue(data, forceSend);
    }

    function sendQueuedItems() {
      if (self.queuedItems.length > 0) {
        // Dequeue:
        self.queuedItems = sortCollectionByProperty(self.queuedItems, 'timestamp');
        var itemsToSend = self.queuedItems.splice(0, self.maxQueueItemsSent);

        sendItemsImmediately(itemsToSend);
      }
    }

    function processVirtualPageTimingsInQueue() {
      var i = 0,
        data;
      for (i; i < self.queuedPerformanceTimings.length; i++) {
        data = self.queuedPerformanceTimings[i];
        if (data.timing.t === Timings.VirtualPage && data.timing.pending) {
          data.timing = generateVirtualEncodedTimingData(data.timing);
        }
      }
    }

    function sendItemImmediately(item) {
      var itemsToSend = [item];

      sendItemsImmediately(itemsToSend);
    }

    function sendItemsImmediately(itemsToSend) {
      var payload = {
        eventData: itemsToSend,
      };

      var successCallback = function() {
        log('Raygun4JS: Items sent successfully. Queue length: ' + self.queuedItems.length);
      };

      var errorCallback = function(response) {

        // Requeue:
        requeueItemsToFront(itemsToSend);

        log(
          'Raygun4JS: Items failed to send. Queue length: ' +
            self.queuedItems.length +
            ' Response status code: ' +
            response.status
        );
      };

      postPayload(payload, successCallback, errorCallback);
    }

    function sendQueuedPerformancePayloads(forceSend) {
      if (self.pendingPayloadData && !forceSend) {
        return;
      }

      var currentPayloadTimingData = [];
      var payloadTimings = [];
      var payloadIncludesPageTiming = false;
      var data, i;

      var addCurrentPayloadEvents = function() {
        payloadTimings.push(createTimingPayload(currentPayloadTimingData));
        currentPayloadTimingData = [];
        payloadIncludesPageTiming = false;
      };

      var sendTimingData = function() {
        if (currentPayloadTimingData.length > 0) {
          addCurrentPayloadEvents();
        }

        if (payloadTimings.length > 0) {
          sendItemsImmediately(payloadTimings);
          currentPayloadTimingData = [];
          payloadIncludesPageTiming = false;
        }
      };

      for (i = 0; i < self.queuedPerformanceTimings.length; i++) {
        data = self.queuedPerformanceTimings[i];
        var isPageOrVirtualPage =
          data.timing.t === Timings.Page || data.timing.t === Timings.VirtualPage;

        if (payloadIncludesPageTiming && isPageOrVirtualPage) {
          // Ensure that pages/virtual pages are both not included in the same 'web_request_timing'
          addCurrentPayloadEvents();
        }

        if (currentPayloadTimingData.length > 0 && isPageOrVirtualPage) {
          // Resources already exist before the page view so associate them with previous "page" by having them as a seperate web_request_timing
          addCurrentPayloadEvents();
        }

        if (isPageOrVirtualPage) {
          // If the next timing data is a page or virtual page, generate a new request ID
          createRequestId();
        }

        if (data.timing.t === Timings.VirtualPage && data.timing.pending) {
          // Pending virtual page, wait until the virtual page timings have been calculated
          sendTimingData();
          self.queuedPerformanceTimings.splice(0, i);
          return;
        }

        currentPayloadTimingData.push(data);
        payloadIncludesPageTiming =
          payloadIncludesPageTiming ||
          (data.timing.t === Timings.Page || data.timing.t === Timings.VirtualPage);
      }

      sendTimingData();
      self.queuedPerformanceTimings = [];
    }

    function requeueItemsToFront(itemsToSend) {
      self.queuedItems = itemsToSend.concat(self.queuedItems);
    }

    function addPerformanceTimingsToQueue(performanceData, forceSend) {
      self.queuedPerformanceTimings = self.queuedPerformanceTimings.concat(performanceData);
      sendQueuedPerformancePayloads(forceSend);
    }

    // ================================================================================
    // =                                                                              =
    // =                                Timing Data                                   =
    // =                                                                              =
    // ================================================================================

    function getPerformanceData(virtualPage, firstLoad) {
      if (
        !performanceEntryExists('timing', 'object') ||
        window.performance.timing.fetchStart === undefined ||
        isNaN(window.performance.timing.fetchStart)
      ) {
        return null;
      }

      var data = [];

      if (firstLoad) {
        // Called by the static onLoad event being fired, persist itself
        data.push(getPrimaryTimingData());
      }

      // Called during both the static load event and the virtual load calls
      // Associates all data loaded up to this point with the previous page
      // Eg: Page load if it is this is a new load, or the last view if a virtual page was freshly triggered
      extractChildData(data);

      if (virtualPage) {
        data.push(getVirtualPrimaryTimingData(virtualPage, getPerformanceNow(0)));

        extractChildData(data, true);
      }

      return data;
    }

    function extractChildData(collection, fromVirtualPage, forceSend) {
      if (!performanceEntryExists('getEntries', 'function')) {
        return;
      }

      try {
        var offset = fromVirtualPage ? 0 : window.performance.timing.navigationStart;
        var resources = window.performance.getEntries();
        var i;

        for (i = self.offset; i < resources.length; i++) {
          var resource = resources[i];
          if(!forceSend && waitingForResourceToFinishLoading(resource)) {
            break;
          } else if (isCustomTimingMeasurement(resource)) {
            if(self.automaticPerformanceCustomTimings) {
              collection.push(getCustomTimingMeasurement(resource));
            }
          } else if (!shouldIgnoreResource(resource)) {
            collection.push(getSecondaryTimingData(resource, offset));
          } 
        }

        self.offset = i;

        if(this._captureMissingRequests) {
          addMissingWrtData(collection, offset);
        }
      } catch (e) {
        log(e);
      }
    }

    /**
     * This adds in the missing WRT data from non 2xx status code responses in Chrome/Safari
     * This is to ensure we have full status code tracking support.
     * It creates a fake WRT payload containing only the duration & XHR type as those are the minimum
     * required set of fields
     */
    var addMissingWrtData = function(collection, offset) {
      log('checking for missing WRT data', this.xhrStatusMap);

      for (var url in this.xhrStatusMap) {
        if (this.xhrStatusMap.hasOwnProperty(url)) {
          var responses = this.xhrStatusMap[url];

          if (responses && responses.length > 0) {
            do {
              var response = responses.shift();
              log('checking response', response);

              if (!shouldIgnoreResourceByName(response.baseUrl)) {
                log('adding missing WRT data for url');

                collection.push({
                  url: response.baseUrl,
                  statusCode: response.status,
                  timing: { 
                    du: maxFiveMinutes(response.duration).toFixed(2), 
                    a: offset.toFixed(2),
                    t: Timings.XHR 
                  },
                });
              }
            } while (responses.length > 0);
          }

          delete this.xhrStatusMap[url];
        }
      }
    }.bind(this);

    function getPrimaryTimingData() {
      var pathName = window.location.pathname;

      if (self.ignoreUrlCasing) {
        pathName = pathName.toLowerCase();
      }

      var url = window.location.protocol + '//' + window.location.host + pathName;

      if (url.length > 800) {
        url = url.substring(0, 800);
      }

      return {
        url: url,
        userAgent: navigator.userAgent,
        timing: getEncodedTimingData(),
        size: 0,
      };
    }

    function getVirtualPrimaryTimingData(virtualPage, virtualPageStartTime) {
      if (self.ignoreUrlCasing) {
        virtualPage = virtualPage.toLowerCase();
      }

      if (virtualPage.indexOf('?') !== -1) {
        virtualPage = virtualPage.split('?')[0];
      }

      var url = window.location.protocol + '//' + window.location.host + virtualPage;

      if (url.length > 800) {
        url = url.substring(0, 800);
      }

      return {
        url: url,
        userAgent: navigator.userAgent,
        timing: prepareVirtualEncodedTimingData(virtualPageStartTime),
        size: 0,
      };
    }

    var getTimingUrl = function(timing) {
      var url = timing.name.split('?')[0];

      if (self.ignoreUrlCasing) {
        url = url.toLowerCase();
      }

      if (url.length > 800) {
        url = url.substring(0, 800);
      }

      return url;
    }.bind(this);

    /**
     * Stops sending through timing information if a XHR request has been made by the response handler hasn't been fired. 
     * This is to prevent issues where multiple timings for the same asset can be sent. 
     * Once for the performance timing and another for the missing request (if the captureMissingRequests option is enabled)
     */
    var waitingForResourceToFinishLoading = function(timing) {
      var url = getTimingUrl(timing);
      var request = this.xhrRequestMap[url];

      return request && request.length > 0;
    }.bind(this);

    var getSecondaryTimingData = function(timing, offset) {
      var url = getTimingUrl(timing);

      var timingData = {
        url: url,
        timing: getSecondaryEncodedTimingData(
          timing,
          offset
        ),
        size: timing.decodedBodySize || 0,
      };

      log('retrieving secondary timing data for', timing.name);

      var xhrStatusesForName = this.xhrStatusMap[url];
      if (xhrStatusesForName && xhrStatusesForName.length > 0) {
        timingData.statusCode = this.xhrStatusMap[url].shift().status;

        log('found status for timing', timingData.statusCode);
        if (this.xhrStatusMap[url].length === 0) {
          delete this.xhrStatusMap[url];
        }
      } else {
        log('no status found for timing', this.xhrStatusMap);
      }

      return timingData;
    }.bind(this);

    function getEncodedTimingData() {
      var timing = window.performance.timing;

      var data = {
        du: timing.duration,
        t: Timings.Page,
      };

      data.a = timing.fetchStart;

      if (timing.domainLookupStart && timing.domainLookupStart > 0) {
        data.b = timing.domainLookupStart - data.a;
      }

      if (timing.domainLookupEnd && timing.domainLookupEnd > 0) {
        data.c = timing.domainLookupEnd - data.a;
      }

      if (timing.connectStart && timing.connectStart > 0) {
        data.d = timing.connectStart - data.a;
      }

      if (timing.connectEnd && timing.connectEnd > 0) {
        data.e = timing.connectEnd - data.a;
      }

      if (timing.responseStart && timing.responseStart > 0) {
        data.f = timing.responseStart - data.a;
      }

      if (timing.responseEnd && timing.responseEnd > 0) {
        data.g = timing.responseEnd - data.a;
      }

      if (timing.domLoading && timing.domLoading > 0) {
        data.h = timing.domLoading - data.a;
      }

      if (timing.domInteractive && timing.domInteractive > 0) {
        data.i = timing.domInteractive - data.a;
      }

      if (timing.domContentLoadedEventEnd && timing.domContentLoadedEventEnd > 0) {
        data.j = timing.domContentLoadedEventEnd - data.a;
      }

      if (timing.domComplete && timing.domComplete > 0) {
        data.k = maxFiveMinutes(timing.domComplete - data.a);
      }

      if (timing.loadEventStart && timing.loadEventStart > 0) {
        data.l = timing.loadEventStart - data.a;
      }

      if (timing.loadEventEnd && timing.loadEventEnd > 0) {
        data.m = timing.loadEventEnd - data.a;
      }

      if (timing.secureConnectionStart && timing.secureConnectionStart > 0) {
        data.n = (timing.secureConnectionStart - timing.connectStart) - data.a;
      }

      data = sanitizeNaNs(data);

      data = addPaintTimings(data);

      return data;
    }

    /**
     * Adds first-paint and first-contentful-paint timings onto the main page timing. 
     * The performance API is used as it's a more standard method only supported in Chrome.
     * `msFirstPaint` is used for Edge/IE browsers and returns a Unix timestamp. We calculate 
     * the difference between 'msFirstPaint' and 'connectStart' to get first-paint for Edge/IE.
     */
    function addPaintTimings(data) {
      if(!performanceEntryExists('getEntriesByName', 'function')) {
        return data;
      }

      var firstPaint = window.performance.getEntriesByName('first-paint');

      if(firstPaint.length > 0 && firstPaint[0].startTime > 0) {
        data.fp = firstPaint[0].startTime.toFixed(2); 
      } else if(window.performance.timing && !!window.performance.timing.msFirstPaint) {
        data.fp = (window.performance.timing.msFirstPaint - window.performance.timing.fetchStart).toFixed(2);
      }

      var firstContentfulPaint = window.performance.getEntriesByName('first-contentful-paint');

      if(firstContentfulPaint.length > 0 && firstContentfulPaint[0].startTime > 0) {
        data.fcp = firstContentfulPaint[0].startTime.toFixed(2); 
      }

      return data;
    }

    function getSecondaryEncodedTimingData(timing, offset) {
      var data = {
        du: maxFiveMinutes(timing.duration).toFixed(2),
        t: getSecondaryTimingType(timing),
        a: offset + timing.fetchStart,
      };

      if (timing.domainLookupStart && timing.domainLookupStart > 0) {
        data.b = offset + timing.domainLookupStart - data.a;
      }

      if (timing.domainLookupEnd && timing.domainLookupEnd > 0) {
        data.c = offset + timing.domainLookupEnd - data.a;
      }

      if (timing.connectStart && timing.connectStart > 0) {
        data.d = offset + timing.connectStart - data.a;
      }

      if (timing.connectEnd && timing.connectEnd > 0) {
        data.e = offset + timing.connectEnd - data.a;
      }

      if (timing.responseStart && timing.responseStart > 0) {
        data.f = offset + timing.responseStart - data.a;
      }

      if (timing.responseEnd && timing.responseEnd > 0) {
        data.g = offset + timing.responseEnd - data.a;
      }

      if (timing.secureConnectionStart && timing.secureConnectionStart > 0) {
        data.n = offset + (timing.secureConnectionStart - timing.connectStart) - data.a;
      }

      data.a = data.a.toFixed(2);
      data = sanitizeNaNs(data);

      return data;
    }

    function generateVirtualEncodedTimingData(timingData) {
      var now = getPerformanceNow(0);

      return {
        t: timingData.t,
        du: Math.min(self.maxVirtualPageDuration, now - timingData.startTime),
        o: Math.min(self.maxVirtualPageDuration, now - timingData.staticLoad),
      };
    }

    function prepareVirtualEncodedTimingData(virtualPageStartTime) {
      return {
        t: Timings.VirtualPage,
        startTime: virtualPageStartTime,
        staticLoad: self.initalStaticPageLoadTimestamp,
        pending: true,
      };
    }

    // ================================================================================
    // =                                                                              =
    // =                                Networking                                    =
    // =                                                                              =
    // ================================================================================

    function postPayload(payload, _successCallback, _errorCallback) {
      if (typeof _successCallback !== 'function') {
        _successCallback = function() {};
      }

      if (typeof _errorCallback !== 'function') {
        _errorCallback = function() {};
      }

      makePostCorsRequestRum(
        self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey),
        payload,
        _successCallback,
        _errorCallback
      );
    }

    function makePostCorsRequestRum(url, data, successCallback, errorCallback) {
      if (self.excludedUserAgents instanceof Array) {
        for (var userAgentIndex in self.excludedUserAgents) {
          if (self.excludedUserAgents.hasOwnProperty(userAgentIndex)) {
            if (navigator.userAgent.match(self.excludedUserAgents[userAgentIndex])) {
              log('Raygun4JS: cancelling send as error originates from an excluded user agent');
              return;
            }
          }
        }
      }

      if (self.excludedHostNames instanceof Array) {
        for (var hostIndex in self.excludedHostNames) {
          if (self.excludedHostNames.hasOwnProperty(hostIndex)) {
            if (
              window.location.hostname &&
              window.location.hostname.match(self.excludedHostNames[hostIndex])
            ) {
              log('Raygun4JS: cancelling send as error originates from an excluded hostname');

              return;
            }
          }
        }
      }

      if (navigator.userAgent.match('RaygunPulseInsightsCrawler')) {
        return;
      }

      var payload = self.beforeSend(data);
      if (!payload) {
        log('Raygun4JS: cancelling send because onBeforeSendRUM returned falsy value');
        return;
      }

      if (!!payload.eventData) {
        for (var i = 0; i < payload.eventData.length; i++) {
          if (!!payload.eventData[i].data && typeof payload.eventData[i].data !== 'string') {
            payload.eventData[i].data = JSON.stringify(payload.eventData[i].data);
          }
        }
      }

      var stringifiedPayload = JSON.stringify(payload);

      // When the document is unloading, all inflight XHR requests will be canceled. Try sendBeacon instead.
      if (self.pageIsUnloading && navigator.sendBeacon) {
        navigator.sendBeacon(url, stringifiedPayload);
        return;
      } 

      makePostCorsRequest(url, stringifiedPayload, successCallback, errorCallback);
    }

    // ================================================================================
    // =                                                                              =
    // =                                  Utilities                                   =
    // =                                                                              =
    // ================================================================================

    /**
     * Returns true if the resources entry type is set to "measure"
     */
    function isCustomTimingMeasurement(resource) {
      return !!(resource && resource.entryType === "measure");
    }    
    this.Utilities["isCustomTimingMeasurement"] = isCustomTimingMeasurement;

    /**
     * Creates a custom timing measurement from a ResourceMeasure value passed.
     * The ResourceMeasure object passed in should be retrieved from the window.performance API
     */
    function getCustomTimingMeasurement(resource) {
      return createCustomTimingMeasurement(resource.name, resource.duration, resource.startTime);
    }
    this.Utilities["getCustomTimingMeasurement"] = getCustomTimingMeasurement;

    /**
     * Creates a custom timing measurement for a name and duration passed.
     * This can be used to create custom timings separate to the window.performance API
     */
    function createCustomTimingMeasurement(name, duration, offset) {
      return {
        url: name,
        timing: {
          t: Timings.CustomTiming,
          du: duration.toFixed(2),
          a: (offset || 0).toFixed(2)
        }
      };
    }
    this.Utilities["createCustomTimingMeasurement"] = createCustomTimingMeasurement;

    /**
     * Add to the requestMap. This marks the request as being in "flight" 
     * and stops collecting metrics until this request has completed. 
     */
    function xhrRequestHandler(request) {
      if(!this.xhrRequestMap[request.baseUrl]) {
        this.xhrRequestMap[request.baseUrl] = [];
      }

      log('adding request to xhr request map', request);

      this.xhrRequestMap[request.baseUrl].push(request);
    }
    
    /**
     * Removes the request from the requestMap so that metric collection can be resumed. 
     */
    function xhrErrorHandler(response) {
      var request = this.xhrRequestMap[response.baseUrl];

      if(request && request.length > 0) {
        this.xhrRequestMap[response.baseUrl].shift();
        log('request encountered an error', response);
      }	      
    }

    /**
     * Removes the asset from the requestMap if found and adds the response to the 
     * statusMap so that the status code can be associated with the request. 
     * 
     * If the 'captureMissingRequests' option is enabled and the timing metric is missing 
     * the duration will also be used to create a new XHR timing.    
     */
    function xhrResponseHandler(response) {
      var request = this.xhrRequestMap[response.baseUrl];

      if(request && request.length > 0) {
        this.xhrRequestMap[response.baseUrl].shift();

        if(this.xhrRequestMap[response.baseUrl].length === 0) {
          delete this.xhrRequestMap[response.baseUrl];
        }

        if (!this.xhrStatusMap[response.baseUrl]) {
          this.xhrStatusMap[response.baseUrl] = [];
        }

        log('adding response to xhr status map', response);
        this.xhrStatusMap[response.baseUrl].push(response);
      } else {
        log('response fired from non-handled request');
      }
    }	    

    function shouldIgnoreResource(resource) {
      var name = resource.name.split('?')[0];

      return shouldIgnoreResourceByName(name) || resource.entryType === "paint" || resource.entryType === "navigation" || resource.entryType === "mark";
    }

    function shouldIgnoreResourceByName(name) {
      if (name.indexOf(self.apiUrl) === 0) {
        return true;
      }
      if (name.indexOf('favicon.ico') > 0) {
        return true;
      }
      if (name.indexOf('about:blank') === 0) {
        return true;
      }
      if (name[0] === 'j' && name.indexOf('avascript:') === 1) {
        return true;
      }
      if (name.indexOf('chrome-extension://') === 0) {
        return true;
      }
      if (name.indexOf('res://') === 0) {
        return true;
      }
      if (name.indexOf('file://') === 0) {
        return true;
      }

      return false;
    }

    function sanitizeNaNs(data) {
      for (var i in data) {
        if (isNaN(data[i]) && typeof data[i] !== 'string') {
          data[i] = 0;
        }
      }

      return data;
    }

    function randomKey(length) {
      return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))
        .toString(36)
        .slice(1);
    }

    function performanceEntryExists(entry, entryType) {
      return (
        typeof window.performance === 'object' &&
        (!entry || (entry && typeof window.performance[entry] === entryType))
      );
    }

    function getPerformanceNow(fallbackValue) {
      if (performanceEntryExists('now', 'function')) {
        return window.performance.now();
      } else {
        return fallbackValue;
      }
    }

    function maxFiveMinutes(milliseconds) {
      return Math.min(milliseconds, 300000);
    }

    function log(message, data) {
      if (self.debugMode && window.console && window.console.log) {
        if (data) {
          window.console.log(message, data);
        } else {
          window.console.log(message);
        }
      }
    }

    function createTimingPayload(data) {
      return {
        sessionId: self.sessionId,
        requestId: self.requestId,
        timestamp: new Date().toISOString(),
        type: 'web_request_timing',
        user: self.user,
        version: self.version || 'Not supplied',
        device: navigator.userAgent,
        tags: self.tags,
        data: data,
      };
    }

    function createRequestId() {
      self.requestId = randomKey(16);
    }

    function saveToStorage(value) {
      var lastActivityTimestamp = new Date().toISOString();
      var updatedValue = 'id|' + value + '&timestamp|' + lastActivityTimestamp;

      if(Raygun.Utilities.localStorageAvailable()) {
        localStorage.setItem(self.cookieName, updatedValue);
      } else {
        Raygun.Utilities.createCookie(self.cookieName, updatedValue, null, self.setCookieAsSecure);
      }
    }

    function getFromStorage() {
      /**
       * Attempt to get the value from local storage, 
       * If that doesn't contain a value then try from a cookie as previous versions saved it here
       */
      var value; 

      if(Raygun.Utilities.localStorageAvailable()) {
        value = localStorage.getItem(self.cookieName);
        if(value !== null) {
          return value;
        }
      }

      if(Raygun.Utilities.sessionStorageAvailable()) {
        value = sessionStorage.getItem(self.cookieName);
        if(value !== null) {
          saveToStorage(value);
          return value;
        }
      }

      value = Raygun.Utilities.readCookie(self.cookieName);

      /**
       * If there was a cookie and localStorage is avaliable then  
       * clear the cookie as sessionStorage will be the storage mechanism going forward
       */  
      if(value !== null && Raygun.Utilities.localStorageAvailable()) {
        Raygun.Utilities.clearCookie(self.cookieName);
        localStorage.setItem(self.cookieName, value);
      }

      return value;
    }

    function readStorageElement(cookieString, element) {
      var set = cookieString.split(/[|&]/);

      if (element === 'id') {
        return set[1];
      } else if (element === 'timestamp') {
        return set[3];
      }
    }

    function getSecondaryTimingType(timing) {
      if (isXHRTiming(timing.initiatorType)) {
        return Timings.XHR;
      } else if (isChildAsset(timing)) {
        return getTypeForChildAsset(timing);
      } else if (isChromeFetchCall(timing)) {
        return Timings.XHR;
      } else {
        return getTypeForChildAsset(timing);
      }
    }

    function isXHRTiming(initiatorType) {
      return (
        initiatorType === 'xmlhttprequest' || 
        initiatorType === 'fetch' || 
        initiatorType === 'preflight' || // 'preflight' initatorType used by Edge for CORS POST/DELETE requests
        initiatorType === 'beacon' // for navigator.sendBeacon calls in Chrome/Edge. Safari doesn't record the timings and Firefox marks them as 'other' 
      ); 
    }

    function isChromeFetchCall(timing) {
      // Chrome doesn't report "initiatorType" as fetch
      return typeof timing.initiatorType === 'string' && timing.initiatorType === '';
    }

    function isChildAsset(timing) {
      switch (timing.initiatorType) {
        case 'img':
        case 'css':
        case 'script':
        case 'link':
        case 'other':
        case 'use':
          return true;
      }
      return false;
    }

    function getTypeForChildAsset(timing) {
      if (timing.duration === 0) {
        return Timings.CachedChildAsset;
      } else {
        return Timings.ChildAsset;
      }
    }

    /**
     * getCompareFunction() returns a predicate function to pass into the Array.sort() function
     * The predicate function checks for the property on each item being compared and returns the appropriate integer required by the sort function
     *
     * @param {string} property
     * @return {function} (a, b) => number
     */
    function getCompareFunction(property) {
      return function(a, b) {
        if (!a.hasOwnProperty(property) || !b.hasOwnProperty(property)) {
          log('Raygun4JS: Property "' + property + '" not found in items in this collection');
          return 0;
        }

        var propA = a[property];
        var propB = b[property];

        var comparison = 0;
        if (propA > propB) {
          comparison = 1;
        } else if (propA < propB) {
          comparison = -1;
        }
        return comparison;
      };
    }

    /**
     * sortCollectionByProperty() returns an array of objects sorted by a given property on those objects
     *
     * @param {array} collection
     * @param {string} property
     * @return {array} collection
     */
    function sortCollectionByProperty(collection, property) {
      return collection.sort(getCompareFunction(property));
    }

    _private.updateStorageTimestamp = updateStorageTimestamp;
  };
};

raygunRumFactory(window, window.jQuery, window.__instantiatedRaygun);
