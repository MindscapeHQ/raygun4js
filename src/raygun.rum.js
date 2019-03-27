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
    setCookieAsSecure
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
    this.customTimingsEnabled = customTimingsEnabled;
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

    this.queuedItems = [];
    this.maxQueueItemsSent = 50;
    this.setCookieAsSecure = setCookieAsSecure;

    this.xhrStatusMap = {};

    var Timings = {
      Page: 'p',
      VirtualPage: 'v',
      XHR: 'x',
      CachedChildAsset: 'e',
      ChildAsset: 'c',
    };

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
      sendItemImmediately({
        sessionId: self.sessionId,
        requestId: self.requestId,
        timestamp: new Date().toISOString(),
        type: 'session_end',
      });
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
        self.sessionId = randomKey(32);
        saveToStorage(self.sessionId);
        callback(true);
      } else {
        var id = readStorageElement(storageItem, 'id');        
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
      extractChildData(data);
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

    function extractChildData(collection, fromVirtualPage) {
      if (!performanceEntryExists('getEntries', 'function')) {
        return;
      }

      try {
        var resources = window.performance.getEntries();

        for (var i = self.offset; i < resources.length; i++) {
          var segment = resources[i].name.split('?')[0];
          if (!shouldIgnoreResource(segment)) {
            collection.push(getSecondaryTimingData(resources[i], fromVirtualPage));
          }
        }

        addMissingWrtData(collection);

        self.offset = resources.length;
      } catch (e) {}
    }

    /**
     * This adds in the missing WRT data from non 2xx status code responses in Chrome/Safari
     * This is to ensure we have full status code tracking support.
     * It creates a fake WRT payload containing only the duration as that is the minimum
     * required set of fields
     */
    var addMissingWrtData = function(collection) {
      for (var url in this.xhrStatusMap) {
        if (this.xhrStatusMap.hasOwnProperty(url)) {
          var responses = this.xhrStatusMap[url];

          if (responses && responses.length > 0) {
            do {
              var response = responses.shift();

              collection.push({
                url: response.responseURL,
                status: response.status,
                timing: { du: response.duration },
              });
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
        timing: getEncodedTimingData(window.performance.timing, 0),
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

    var getSecondaryTimingData = function(timing, fromZero) {
      var url = timing.name.split('?')[0];

      if (self.ignoreUrlCasing) {
        url = url.toLowerCase();
      }

      if (url.length > 800) {
        url = url.substring(0, 800);
      }

      var timingData = {
        url: url,
        timing: getSecondaryEncodedTimingData(
          timing,
          fromZero ? 0 : window.performance.timing.navigationStart
        ),
        size: timing.decodedBodySize || 0,
      };

      var xhrStatusesForName = this.xhrStatusMap[timing.name];
      if (xhrStatusesForName && xhrStatusesForName.length > 0) {
        timingData.status = this.xhrStatusMap[timing.name].shift().status;

        if (this.xhrStatusMap[timing.name].length === 0) {
          delete this.xhrStatusMap[timing.name];
        }
      }

      return timingData;
    }.bind(this);

    function getEncodedTimingData(timing, offset) {
      var data = {
        du: timing.duration,
        t: Timings.Page,
      };

      data.a = offset + timing.fetchStart;

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

      if (timing.domLoading && timing.domLoading > 0) {
        data.h = offset + timing.domLoading - data.a;
      }

      if (timing.domInteractive && timing.domInteractive > 0) {
        data.i = offset + timing.domInteractive - data.a;
      }

      if (timing.domContentLoadedEventEnd && timing.domContentLoadedEventEnd > 0) {
        data.j = offset + timing.domContentLoadedEventEnd - data.a;
      }

      if (timing.domComplete && timing.domComplete > 0) {
        data.k = maxFiveMinutes(offset + timing.domComplete - data.a);
      }

      if (timing.loadEventStart && timing.loadEventStart > 0) {
        data.l = offset + timing.loadEventStart - data.a;
      }

      if (timing.loadEventEnd && timing.loadEventEnd > 0) {
        data.m = offset + timing.loadEventEnd - data.a;
      }

      if (timing.secureConnectionStart && timing.secureConnectionStart > 0) {
        data.n = offset + (timing.secureConnectionStart - timing.connectStart) - data.a;
      }

      data = sanitizeNaNs(data);

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

      makePostCorsRequest(url, JSON.stringify(payload), successCallback, errorCallback);
    }

    // ================================================================================
    // =                                                                              =
    // =                                  Utilities                                   =
    // =                                                                              =
    // ================================================================================

    function xhrResponseHandler(response) {
      if (!this.xhrStatusMap[response.responseURL]) {
        this.xhrStatusMap[response.responseURL] = [];
      }

      this.xhrStatusMap[response.responseURL].push(response);
    }

    function shouldIgnoreResource(name) {
      if (name.indexOf(self.apiUrl) === 0) {
        return true;
      }
      // Other ignored calls
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
        window.console.log(message);

        if (data) {
          window.console.log(data);
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

      if(Raygun.Utilities.sessionStorageAvailable()) {
        sessionStorage.setItem(self.cookieName, updatedValue);
      } else {
        Raygun.Utilities.createCookie(self.cookieName, updatedValue, null, self.setCookieAsSecure);
      }
    }

    function getFromStorage() {
      if(Raygun.Utilities.sessionStorageAvailable()) {
        var value = sessionStorage.getItem(self.cookieName);
        if(value !== null) {
          return value;
        }
      }

      var value = Raygun.Utilities.readCookie(self.cookieName);

      /**
       * If there was a cookie and localStorage is avaliable then  
       * clear the cookie as localStorage will be the storage mechanism going forward
       */  
      if(value !== null && Raygun.Utilities.sessionStorageAvailable()) {
        Raygun.Utilities.clearCookie(self.cookieName);
        sessionStorage.setItem(self.cookieName, value);
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
      if (timing.initiatorType === 'xmlhttprequest' || timing.initiatorType === 'fetch') {
        return Timings.XHR;
      } else if (isChildAsset(timing)) {
        return getTypeForChildAsset(timing);
      } else if (isChromeFetchCall(timing)) {
        return Timings.XHR;
      } else {
        return getTypeForChildAsset(timing);
      }
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
