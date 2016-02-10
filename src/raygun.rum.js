/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

var raygunRumFactory = function (window, $, Raygun) {
    Raygun.RealUserMonitoring = function (apiKey, apiUrl, makePostCorsRequest, user, version, excludedHostNames, excludedUserAgents, debugMode, maxVirtualPageDuration) {
        var self = this;
        var _private = {};

        this.cookieName = 'raygun4js-sid';
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.debugMode = debugMode;
        this.excludedHostNames = excludedHostNames;
        this.excludedUserAgents = excludedUserAgents;
        this.maxVirtualPageDuration = maxVirtualPageDuration || 1800000; // 30 minutes

        this.makePostCorsRequest = function (url, data) {
            if (self.excludedUserAgents instanceof Array) {
                for (var userAgentIndex in self.excludedUserAgents) {
                    if (self.excludedUserAgents.hasOwnProperty(userAgentIndex)) {
                        if (navigator.userAgent.match(self.excludedUserAgents[userAgentIndex])) {
                            if (self.debugMode) {
                                log('Raygun4JS: cancelling send as error originates from an excluded user agent');
                            }

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

            makePostCorsRequest(url, data);
        };
        this.sessionId = null;
        this.virtualPage = null;
        this.user = user;
        this.version = version;
        this.heartBeatInterval = null;
        this.offset = 0;

        this.attach = function () {
            getSessionId(function (isNewSession) {
                self.pageLoaded(isNewSession);
            });

            var clickHandler = function () {
                this.updateCookieTimestamp();
            }.bind(_private);
            
            var unloadHandler = function () {
                var data = [];

                extractChildData(data);

                if (data.length > 0) {
                    var payload = {
                        eventData: [{
                            sessionId: self.sessionId,
                            timestamp: new Date().toISOString(),
                            type: 'web_request_timing',
                            user: self.user,
                            version: self.version || 'Not supplied',
                            device: navigator.userAgent,
                            data: JSON.stringify(data)
                        }]
                    };

                    self.makePostCorsRequest(self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey), JSON.stringify(payload));
                }
            };

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
                var payload = {
                    eventData: [{
                        sessionId: self.sessionId,
                        timestamp: new Date().toISOString(),
                        type: 'session_start',
                        user: self.user,
                        version: self.version || 'Not supplied',
                        device: navigator.userAgent
                    }]
                };

                self.makePostCorsRequest(self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey), JSON.stringify(payload));
            }

            self.sendPerformance(true, true);
            self.heartBeat();
            
            if (typeof window.performance === 'object' && typeof window.performance.now === 'function') {
              self.initalStaticPageLoadTimestamp = window.performance.now();
            } else {
              self.initalStaticPageLoadTimestamp = 0;
            }
        };

        this.setUser = function (user) {
            self.user = user;
        };

        this.endSession = function () {
            var payload = {
                eventData: [{
                    sessionId: self.sessionId,
                    timestamp: new Date().toISOString(),
                    type: 'session_end'

                }]
            };

            self.makePostCorsRequest(self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey), JSON.stringify(payload));
        };

        this.heartBeat = function () {
            self.heartBeatInterval = setInterval(function () {
                var data = [];
                var payload;

                extractChildData(data, self.virtualPage);

                if (data.length > 0) {
                    var dataJson = JSON.stringify(data);

                    if (stringToByteLength(dataJson) < 128000) { // 128kB payload size
                      payload = {
                          eventData: [{
                              sessionId: self.sessionId,
                              timestamp: new Date().toISOString(),
                              type: 'web_request_timing',
                              user: self.user,
                              version: self.version || 'Not supplied',
                              device: navigator.userAgent,
                              data: dataJson
                          }]
                      };
                    }
                }

                if (payload !== undefined) {
                    self.makePostCorsRequest(self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey), JSON.stringify(payload));
                }
          }, 30 * 1000); // 30 seconds between heartbeats
        };

        this.virtualPageLoaded = function (path) {
            var firstVirtualLoad = this.virtualPage == null;
            
            if (typeof path === 'string') {
                if (path.length > 0 && path[0] !== '/') {
                  path = path + '/';
                }

                this.virtualPage = path;
            }
            
            if (firstVirtualLoad) {
              this.sendPerformance(true, false);
            } else {
              this.sendPerformance(false, false);
            }
            
            if (typeof path === 'string') {
              if (typeof window.performance === 'object' && typeof window.performance.now === 'function') {
                this.previousVirtualPageLoadTimestamp = window.performance.now();
              } else {
                this.previousVirtualPageLoadTimestamp = 0;
              }
            }
        };

        this.sendPerformance = function (flush, firstLoad) {
            var performanceData = getPerformanceData(this.virtualPage, flush, firstLoad);

            if (performanceData === null) {
                return;
            }

            var payload = {
                eventData: [{
                    sessionId: self.sessionId,
                    timestamp: new Date().toISOString(),
                    type: 'web_request_timing',
                    user: self.user,
                    version: self.version || 'Not supplied',
                    device: navigator.userAgent,
                    data: JSON.stringify(performanceData)
                }]
            };

            self.makePostCorsRequest(self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey), JSON.stringify(payload));
        };

        function stringToByteLength(str) {
            var m = encodeURIComponent(str).match(/%[89ABab]/g);
            return str.length + (m ? m.length : 0);
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

                if (id === 'undefined') {
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
                self.pageLoaded(true);
            }
        }

        function maxFiveMinutes(milliseconds) {
            return Math.min(milliseconds, 300000);
        }

        function sanitizeNaNs(data) {
            for (var i in data) {
                if (isNaN(data[i]) && typeof data[i] !== 'string') {
                    data[i] = 0;
                }
            }

            return data;
        }

        function generateVirtualEncodedTimingData(previousVirtualPageLoadTimestamp, initalStaticPageLoadTimestamp) {
          var now;
          if (typeof window.performance === 'object' && typeof window.performance.now === 'function') {
            now = window.performance.now();
          } else {
            now = 0;
          }
          
          return {
            t: 'v',
            du: Math.min(self.maxVirtualPageDuration, now - (previousVirtualPageLoadTimestamp || initalStaticPageLoadTimestamp)),
            o: Math.min(self.maxVirtualPageDuration, now - initalStaticPageLoadTimestamp)
          };
        }

        function getEncodedTimingData(timing, offset) {
            var data = {
                du: timing.duration,
                t: 'p'
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
                data.k = maxFiveMinutes((offset + timing.domComplete) - data.a);
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

        function getSecondaryEncodedTimingData(timing, offset) {
            var data = {
                du: maxFiveMinutes(timing.duration).toFixed(2),
                t: timing.initiatorType === 'xmlhttprequest' ? 'x' : timing.duration === 0.0 ? 'e' : 'c',
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
            return {
                url: window.location.protocol + '//' + window.location.host + window.location.pathname,
                userAgent: navigator.userAgent,
                timing: getEncodedTimingData(window.performance.timing, 0),
                size: 0
            };
        }

        function getVirtualPrimaryTimingData(virtualPage, previousVirtualPageLoadTimestamp, initalStaticPageLoadTimestamp) {
            return {
                url: window.location.protocol + '//' + window.location.host + virtualPage,
                userAgent: navigator.userAgent,
                timing: generateVirtualEncodedTimingData(previousVirtualPageLoadTimestamp, initalStaticPageLoadTimestamp),
                size: 0
            };
        }

        function getSecondaryTimingData(timing, fromZero) {
            return {
                url: timing.name.split('?')[0],
                timing: getSecondaryEncodedTimingData(timing, fromZero ? 0 : window.performance.timing.navigationStart),
                size: timing.decodedBodySize || 0
            };
        }

        function extractChildData(collection, fromVirtualPage) {
            if (window.performance === undefined || !window.performance.getEntries) {
                return;
            }

            try {
                var resources = window.performance.getEntries();

                for (var i = self.offset; i < resources.length; i++) {
                    var segment = resources[i].name.split('?')[0];

                    // swallow any calls to Raygun itself
                    if (segment.indexOf(self.apiUrl) === 0) {
                        continue;
                    }

                    // Other ignored calls
                    if (segment.indexOf('favicon.ico') > 0) {
                        continue;
                    }
                    if (segment.indexOf('about:blank') === 0) {
                        continue;
                    }
                    if (segment[0] === 'j' && segment.indexOf('avascript:') === 1) {
                        continue;
                    }
                    if (segment.indexOf('chrome-extension://') === 0) {
                        continue;
                    }
                    if (segment.indexOf('res://') === 0) {
                        continue;
                    }
                    if (segment.indexOf('file://') === 0) {
                        continue;
                    }

                    collection.push(getSecondaryTimingData(resources[i], fromVirtualPage));
                }

                self.offset = resources.length;
            }
            catch (e) {
            }
        }

        function getPerformanceData(virtualPage, flush, firstLoad) {
            if (window.performance === undefined || isNaN(window.performance.timing.fetchStart)) {
                return null;
            }

            var data = [];
            
            if (flush) {
              // Called by the static onLoad event being fired, persist itself
              if (firstLoad) { 
                data.push(getPrimaryTimingData());
              }
              
              // Called during both the static load event and the flush on the first virtual load call
              extractChildData(data);  
            }

            if (virtualPage) {
              // A previous virtual load was stored, persist it and its children up until now
              if (self.pendingVirtualPage) {
                data.push(self.pendingVirtualPage);
                extractChildData(data, true);
              }
              
              var firstVirtualLoad = self.pendingVirtualPage == null;
              
              // Store the current virtual load so it can be sent upon the next one
              self.pendingVirtualPage = getVirtualPrimaryTimingData(
                virtualPage,
                self.previousVirtualPageLoadTimestamp,
                self.initalStaticPageLoadTimestamp
              );
              
              // Prevent sending an empty payload for the first virtual load as we don't know when it will end
              if (!firstVirtualLoad && data.length > 0) {
                return data;
              }
            }

            return data;
        }

        function randomKey(length) {
            return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
        }

        function log(message, data) {
            if (window.console && window.console.log && self.debugMode) {
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