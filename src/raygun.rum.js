/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */
var raygunRumFactory = function (window, $, Raygun) {
    Raygun.RealUserMonitoring = function (apiKey, apiUrl, makePostCorsRequest, user, version, tags, excludedHostNames, excludedUserAgents, debugMode, maxVirtualPageDuration, ignoreUrlCasing, customTimingsEnabled, beforeSendCb) {
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
        this.pendingPerformancePayload = null;
        this.beforeSend = beforeSendCb || function(payload) { return payload; };

        this.pendingPayloadData = customTimingsEnabled || false;
        this.queuedPerformanceTimings = [];

        this.sessionId = null;
        this.virtualPage = null;
        this.user = user;
        this.version = version;
        this.tags = tags;
        this.heartBeatInterval = null;
        this.offset = 0;

        var Timings = {
          Page: 'p',
          VirtualPage: 'v',
          XHR: 'x',
          CachedChildAsset: 'e',
          ChildAsset: 'c'
        };
        var MaxPayloadSize = 128000;

        this.attach = function () {
            getSessionId(function (isNewSession) {
              self.pageLoaded(isNewSession);
            });

            var clickHandler = function () {
              this.updateCookieTimestamp();
            }.bind(_private);

            var unloadHandler = function () {
              self.sendPerformance(false, false, true);
            }.bind(_private);

            var visibilityChangeHandler = function () {
                if (document.visibilityState === 'visible') {
                    this.updateCookieTimestamp();
                }
            }.bind(_private);

            if (window.addEventListener) {
                window.addEventListener('click', clickHandler);
                document.addEventListener('visibilitychange', visibilityChangeHandler);
                window.addEventListener('beforeunload', unloadHandler);
            } else if (window.attachEvent) {
                document.attachEvent('onclick', clickHandler);
            }
        };

        this.pageLoaded = function (isNewSession) {
            // Only create a session if we don't have one.
            if (isNewSession) {
                this.sendNewSessionStart();
            }

            self.sendPerformance(true, true);

            self.heartBeat();

            self.initalStaticPageLoadTimestamp = getPerformanceNow(0);
        };

        this.sendNewSessionStart = function() {
          var payload = {
              eventData: [{
                  sessionId: self.sessionId,
                  timestamp: new Date().toISOString(),
                  type: 'session_start',
                  user: self.user,
                  version: self.version || 'Not supplied',
                  tags: self.tags,
                  device: navigator.userAgent
              }]
          };

          self.postPayload(payload);
        };

        this.sendCustomTimings = function (customTimings) {
            if (typeof customTimings === 'object' && (
              typeof customTimings.custom1 === 'number' ||
              typeof customTimings.custom2 === 'number' ||
              typeof customTimings.custom3 === 'number' ||
              typeof customTimings.custom4 === 'number' ||
              typeof customTimings.custom5 === 'number' ||
              typeof customTimings.custom6 === 'number' ||
              typeof customTimings.custom7 === 'number' ||
              typeof customTimings.custom8 === 'number' ||
              typeof customTimings.custom9 === 'number' ||
              typeof customTimings.custom10 === 'number')) {
                if( self.pendingPayloadData && self.queuedPerformanceTimings.length > 0) {
                  // Append custom timings to first queued item, which should be a page view
                  self.pendingPayloadData = false;
                  self.queuedPerformanceTimings[0].customTiming = customTimings;
                  sendQueuedPerformancePayloads();
                }
              }
        };

        this.setUser = function (user) {
            self.user = user;
        };

        this.withTags = function (tags) {
            self.tags = tags;
        };

        this.endSession = function () {
            var payload = {
                eventData: [{
                  sessionId: self.sessionId,
                  timestamp: new Date().toISOString(),
                  type: 'session_end'
                }]
            };

            self.postPayload(payload);
        };

        this.heartBeat = function () {

          if(self.heartBeatInterval !== null) {
            log('Raygun4JS: Heartbeat already exists. Skipping heartbeat creation.');
            return;
          }

          self.heartBeatInterval = setInterval(function () {
              self.sendPerformance(false, false);
          }, 30 * 1000); // 30 seconds between heartbeats
        };

        this.virtualPageLoaded = function (path) {
            var firstVirtualLoad = this.virtualPage == null;

            if (typeof path === 'string') {
                if (path.length > 0 && path[0] !== '/') {
                    // I believe this should add the '/' to the start of the path and not the end?
                    path = path + '/';
                }

                if (path.length > 800) {
                    path = path.substring(0, 800);
                }

                this.virtualPage = path;
            }

            this.sendPerformance(!!firstVirtualLoad, false);

            if (typeof path === 'string') {
              this.previousVirtualPageLoadTimestamp = getPerformanceNow(0);
            }
        };

        this.sendPerformance = function (flush, firstLoad, forceSend) {
            var performanceData = getPerformanceData(this.virtualPage, flush, firstLoad);

            if (performanceData === null || performanceData.length < 0) {
                return;
            }

            addPerformanceTimingsToQueue(performanceData, forceSend);
        };

        this.postPayload = function(payload) {
          self.makePostCorsRequest(self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey), payload);
        };

        this.makePostCorsRequest = function (url, data) {
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
                        if (window.location.hostname && window.location.hostname.match(self.excludedHostNames[hostIndex])) {
                            log('Raygun4JS: cancelling send as error originates from an excluded hostname');

                            return;
                        }
                    }
                }
            }

            if (navigator.userAgent.match("RaygunPulseInsightsCrawler")) {
                return;
            }

            var payload = self.beforeSend(data);
            if (!payload) {
                log('Raygun4JS: cancelling send because onBeforeSendRUM returned falsy value');
                return;
            }

            if (!!payload.eventData) {
                for (var i = 0;i < payload.eventData.length;i++) {
                    if (!!payload.eventData[i].data) {
                        payload.eventData[i].data = JSON.stringify(payload.eventData[i].data);
                    }
                }
            }

            makePostCorsRequest(url, JSON.stringify(payload));
        };

        function addPerformanceTimingsToQueue(performanceData, forceSend) {
          self.queuedPerformanceTimings = self.queuedPerformanceTimings.concat(performanceData);
          sendQueuedPerformancePayloads(forceSend);
        }

        function sendQueuedPerformancePayloads(forceSend) {
          if(self.pendingPayloadData && !forceSend) {
            return;
          }

          var currentPayloadTimingData = [];
          var payloadIncludesPageTiming = false;
          var data, i;
          var timingPayloadSize;

          var sendCurrentTimingData = function() {
            self.postPayload({
              eventData: [
                createTimingPayload(currentPayloadTimingData)
              ]
            });
            currentPayloadTimingData = [];
            payloadIncludesPageTiming = false;
          };

          for(i = 0; i < self.queuedPerformanceTimings.length; i++) {
            data = self.queuedPerformanceTimings[i];

            if(payloadIncludesPageTiming && (data.timing.t === Timings.Page || data.timing.t === Timings.VirtualPage)) {
              // Ensure that pages/virtual pages are both not included in the same 'web_request_timing
              sendCurrentTimingData();
            }

            currentPayloadTimingData.push(data);
            timingPayloadSize = stringToByteLength(JSON.stringify(createTimingPayload(currentPayloadTimingData)));

            if(timingPayloadSize > MaxPayloadSize) {
              currentPayloadTimingData.pop();
              sendCurrentTimingData();
              currentPayloadTimingData.push(data);
            }

            payloadIncludesPageTiming = payloadIncludesPageTiming || (data.timing.t === Timings.Page || data.timing.t === Timings.VirtualPage);
          }

          if(currentPayloadTimingData.length > 0) {
            sendCurrentTimingData();
          }

          self.queuedPerformanceTimings = [];
        }

        function createTimingPayload(data) {
            return {
              sessionId: self.sessionId,
              timestamp: new Date().toISOString(),
              type: 'web_request_timing',
              user: self.user,
              version: self.version || 'Not supplied',
              device: navigator.userAgent,
              tags: self.tags,
              data: data
            };
        }

        function getSessionId(callback) {
            var existingCookie = readCookie(self.cookieName);

            var nullCookie = existingCookie === null;
            var legacyCookie = typeof exisitingCookie === 'string' &&
                existingCookie.length > 0 &&
                existingCookie.indexOf('timestamp') === -1;
            var expiredCookie = null;

            if (!nullCookie && !legacyCookie) {
                var existingTimestamp = new Date(readSessionCookieElement(existingCookie, 'timestamp'));
                var halfHrAgo = new Date(new Date() - 30 * 60000);
                expiredCookie = existingTimestamp < halfHrAgo;
            }

            if (nullCookie || legacyCookie || expiredCookie) {
                self.sessionId = randomKey(32);
                createCookie(self.cookieName, self.sessionId);
                callback(true);
            } else {
                var sessionCookie = readCookie(self.cookieName);
                var id = readSessionCookieElement(sessionCookie, 'id');

                if (id === 'undefined' || id === 'null') {
                    self.sessionId = randomKey(32);
                    createCookie(self.cookieName, self.sessionId);
                    callback(true);
                } else {
                    self.sessionId = id;
                    callback(false);
                }
            }
        }

        function createCookie(name, value, hours) {
            var expires;
            var lastActivityTimestamp;

            if (hours) {
                var date = new Date();
                date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
                expires = "; expires=" + date.toGMTString();
            }
            else {
                expires = "";
            }

            lastActivityTimestamp = new Date().toISOString();

            document.cookie = name + "=id|" + value + "&timestamp|" + lastActivityTimestamp + expires + "; path=/";
        }

        function readSessionCookieElement(cookieString, element) {
            var set = cookieString.split(/[|&]/);

            if (element === 'id') {
                return set[1];
            } else if (element === 'timestamp') {
                return set[3];
            }
        }

        function readCookie(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1, c.length);
                }
                if (c.indexOf(nameEQ) === 0) {
                    return c.substring(nameEQ.length, c.length);
                }
            }
            return null;
        }

        function updateCookieTimestamp() {
            var existingCookie = readCookie(self.cookieName);

            var expiredCookie;
            if (existingCookie) {
                var timestamp = new Date(readSessionCookieElement(existingCookie, 'timestamp'));
                var halfHrAgo = new Date(new Date() - 30 * 60000); // 30 mins
                expiredCookie = timestamp < halfHrAgo;
            }
            else {
                expiredCookie = true;
            }

            if (expiredCookie) {
                self.sessionId = randomKey(32);
            }

            createCookie(self.cookieName, self.sessionId);

            if (expiredCookie) {
                self.sendNewSessionStart();
            }
        }

        function generateVirtualEncodedTimingData(previousVirtualPageLoadTimestamp, initalStaticPageLoadTimestamp) {
            var now = getPerformanceNow(0);

            return {
                t: Timings.VirtualPage,
                du: Math.min(self.maxVirtualPageDuration, now - (previousVirtualPageLoadTimestamp || initalStaticPageLoadTimestamp)),
                o: Math.min(self.maxVirtualPageDuration, now - initalStaticPageLoadTimestamp)
            };
        }

        function getEncodedTimingData(timing, offset) {
            var data = {
                du: timing.duration,
                t: Timings.Page
            };

            data.a = offset + timing.fetchStart;

            if (timing.domainLookupStart && timing.domainLookupStart > 0) {
                data.b = (offset + timing.domainLookupStart) - data.a;
            }

            if (timing.domainLookupEnd && timing.domainLookupEnd > 0) {
                data.c = (offset + timing.domainLookupEnd) - data.a;
            }

            if (timing.connectStart && timing.connectStart > 0) {
                data.d = (offset + timing.connectStart) - data.a;
            }

            if (timing.connectEnd && timing.connectEnd > 0) {
                data.e = (offset + timing.connectEnd) - data.a;
            }

            if (timing.responseStart && timing.responseStart > 0) {
                data.f = (offset + timing.responseStart) - data.a;
            }

            if (timing.responseEnd && timing.responseEnd > 0) {
                data.g = (offset + timing.responseEnd) - data.a;
            }

            if (timing.domLoading && timing.domLoading > 0) {
                data.h = (offset + timing.domLoading) - data.a;
            }

            if (timing.domInteractive && timing.domInteractive > 0) {
                data.i = (offset + timing.domInteractive) - data.a;
            }

            if (timing.domContentLoadedEventEnd && timing.domContentLoadedEventEnd > 0) {
                data.j = (offset + timing.domContentLoadedEventEnd) - data.a;
            }

            if (timing.domComplete && timing.domComplete > 0) {
                // Unsure as to why we cap the duration. Kept to maintain backwards compatibility in V2
                data.k = maxFiveMinutes(offset + timing.domComplete) - data.a;
            }

            if (timing.loadEventStart && timing.loadEventStart > 0) {
                data.l = (offset + timing.loadEventStart) - data.a;
            }

            if (timing.loadEventEnd && timing.loadEventEnd > 0) {
                data.m = (offset + timing.loadEventEnd) - data.a;
            }

            if (timing.secureConnectionStart && timing.secureConnectionStart > 0) {
                data.n = (offset + (timing.secureConnectionStart - timing.connectStart)) - data.a;
            }

            data = sanitizeNaNs(data);

            return data;
        }

        function getSecondaryTimingType(timing) {
          if(timing.initiatorType === 'xmlhttprequest') {
            return Timings.XHR;
          } else if(timing.duration === 0) {
            return Timings.CachedChildAsset;
          } else {
            return Timings.ChildAsset;
          }
        }

        function getSecondaryEncodedTimingData(timing, offset) {
            var data = {
                // Unsure as to why we cap the duration. Kept to maintain backwards compatibility in V2
                du: maxFiveMinutes(timing.duration).toFixed(2),
                t: getSecondaryTimingType(timing),
                a: (offset + timing.fetchStart).toFixed(2)
            };

            if (timing.domainLookupStart && timing.domainLookupStart > 0) {
                data.b = (offset + timing.domainLookupStart) - data.a;
            }

            if (timing.domainLookupEnd && timing.domainLookupEnd > 0) {
                data.c = (offset + timing.domainLookupEnd) - data.a;
            }

            if (timing.connectStart && timing.connectStart > 0) {
                data.d = (offset + timing.connectStart) - data.a;
            }

            if (timing.connectEnd && timing.connectEnd > 0) {
                data.e = (offset + timing.connectEnd) - data.a;
            }

            if (timing.responseStart && timing.responseStart > 0) {
                data.f = (offset + timing.responseStart) - data.a;
            }

            if (timing.responseEnd && timing.responseEnd > 0) {
                data.g = (offset + timing.responseEnd) - data.a;
            }

            if (timing.secureConnectionStart && timing.secureConnectionStart > 0) {
                data.n = (offset + (timing.secureConnectionStart - timing.connectStart)) - data.a;
            }

            data = sanitizeNaNs(data);

            return data;
        }

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
                size: 0
            };
        }

        function getVirtualPrimaryTimingData(virtualPage, previousVirtualPageLoadTimestamp, initalStaticPageLoadTimestamp) {
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
                timing: generateVirtualEncodedTimingData(previousVirtualPageLoadTimestamp, initalStaticPageLoadTimestamp),
                size: 0
            };
        }

        function getSecondaryTimingData(timing, fromZero) {
            var url = timing.name.split('?')[0];

            if (self.ignoreUrlCasing) {
                url = url.toLowerCase();
            }

            if (url.length > 800) {
                url = url.substring(0, 800);
            }

            return {
                url: url,
                timing: getSecondaryEncodedTimingData(timing, fromZero ? 0 : window.performance.timing.navigationStart),
                size: timing.decodedBodySize || 0
            };
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

        function extractChildData(collection, fromVirtualPage) {
            if (!performanceEntryExists('getEntries', 'function')) {
                return;
            }

            try {
                var resources = window.performance.getEntries();

                for (var i = self.offset; i < resources.length; i++) {
                    var segment = resources[i].name.split('?')[0];
                    if( !shouldIgnoreResource(segment) ) {
                      collection.push(getSecondaryTimingData(resources[i], fromVirtualPage));
                    }
                }

                self.offset = resources.length;
            }
            catch (e) {
            }
        }

        function getPerformanceData(virtualPage, flush, firstLoad) {
            if (!performanceEntryExists('timing', 'object') || window.performance.timing.fetchStart === undefined || isNaN(window.performance.timing.fetchStart)) {
                return null;
            }

            var data = [];

            if (firstLoad) {
              // Called by the static onLoad event being fired, persist itself
              data.push(getPrimaryTimingData());
            }

            if (flush) {
              // Called during both the static load event and the first virtual load call
              // Associates all data loaded up to this point with the previous page
              extractChildData(data);
            }

            if (virtualPage) {
                data.push(getVirtualPrimaryTimingData(
                    virtualPage,
                    self.previousVirtualPageLoadTimestamp,
                    self.initalStaticPageLoadTimestamp
                ));
                extractChildData(data, true);
            } else if(!flush) {
                extractChildData(data);
            }

            return data;
        }

        function sanitizeNaNs(data) {
            for (var i in data) {
                if (isNaN(data[i]) && typeof data[i] !== 'string') {
                    data[i] = 0;
                }
            }

            return data;
        }

        function stringToByteLength(str) {
            var m = encodeURIComponent(str).match(/%[89ABab]/g);
            return str.length + (m ? m.length : 0);
        }

        function randomKey(length) {
            return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
        }

        function performanceEntryExists(entry, entryType) {
          return (typeof window.performance === "object" && (!entry || entry && typeof window.performance[entry] === entryType));
        }

        function getPerformanceNow(fallbackValue) {
          if(performanceEntryExists('now', 'function')) {
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

        _private.updateCookieTimestamp = updateCookieTimestamp;
    };
};

raygunRumFactory(window, window.jQuery, window.__instantiatedRaygun);
