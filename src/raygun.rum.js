/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

var raygunRumFactory = function (window, $, Raygun) {
    Raygun.RealUserMonitoring = function (apiKey, apiUrl, makePostCorsRequest, user, version, includeHashInPulseUrl) {
        var self = this;
        var _private = {};

        this.cookieName = 'raygun4js-sid';
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.makePostCorsRequest = makePostCorsRequest;
        this.sessionId = null;
        this.user = user;
        this.version = version;
        this.heartBeatInterval = null;
        this.offset = 0;
        this.includeHashInPulseUrl = includeHashInPulseUrl;

        this.attach = function () {
            getSessionId(function (isNewSession) {
                self.pageLoaded(isNewSession);
            });

            window.onbeforeunload = function() {
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

            var clickHandler = function () {
              this.updateCookieTimestamp();
            }.bind(_private);

            var visibilityChangeHandler = function () {
              if (document.visibilityState === 'visible') {
                this.updateCookieTimestamp();
              }

            }.bind(_private);

            if (window.addEventListener) {
              window.addEventListener('click', clickHandler);
              document.addEventListener('visibilitychange', visibilityChangeHandler);
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

            self.sendPerformance();
            self.heartBeat();
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

                extractChildData(data);

                if (data.length > 0) {
                    payload = {
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
                }

                if (payload !== undefined) {
                    self.makePostCorsRequest(self.apiUrl + '/events?apikey=' + encodeURIComponent(self.apiKey), JSON.stringify(payload));
                }
            }, 30 * 1000);
        };

        this.sendPerformance = function () {
            var performanceData = getPerformanceData();

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
          var timestamp = new Date(readSessionCookieElement(existingCookie, 'timestamp'));
          var halfHrAgo = new Date(new Date() - 30 * 60000); // 30 mins
          var expiredCookie = timestamp < halfHrAgo;

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
            var timingData = {
                url: window.location.protocol + '//' + window.location.host + window.location.pathname,
                userAgent: navigator.userAgent,
                timing: getEncodedTimingData(window.performance.timing, 0),
                size: 0
            };

            if(self.includeHashInPulseUrl) {
                var hash = window.location.hash;

                if(hash.substring(0,1) !== '#') {
                    hash = '#' + hash;
                }

                timingData.url += hash;
            }

            return timingData;
        }

        function getSecondaryTimingData(timing) {
            return {
                url: timing.name.split('?')[0],
                timing: getSecondaryEncodedTimingData(timing, window.performance.timing.navigationStart),
                size: timing.decodedBodySize || 0
            };
        }

        function extractChildData(collection) {
            if (window.performance === undefined || !window.performance.getEntries) {
                return;
            }

            try {
                var resources = window.performance.getEntries();

                for (var i = self.offset; i < resources.length; i++) {
                  var segment = resources[i].name.split('?')[0];

                  // swallow any calls to Raygun itself
                  if (segment.indexOf(self.apiUrl) === 0) { continue; }

                  // Other ignored calls
                  if (segment.indexOf('favicon.ico') > 0) { continue; }
                  if (segment.indexOf('about:blank') === 0) { continue; }
                  if (segment[0] === 'j' && segment.indexOf('avascript:') === 1) { continue; }
                  if (segment.indexOf('chrome-extension://') === 0) { continue; }
                  if (segment.indexOf('res://') === 0) { continue; }
                  if (segment.indexOf('file://') === 0) { continue; }

                  collection.push(getSecondaryTimingData(resources[i]));
                }

                self.offset = resources.length;
            }
            catch (e) {
            }
        }

        function getPerformanceData() {
            if (window.performance === undefined || isNaN(window.performance.timing.fetchStart)) {
                return null;
            }

            var data = [];

            data.push(getPrimaryTimingData());

            extractChildData(data);

            return data;
        }

        function randomKey(length) {
            return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
        }

        _private.updateCookieTimestamp = updateCookieTimestamp;
    };
};

raygunRumFactory(window, window.jQuery, window.Raygun);