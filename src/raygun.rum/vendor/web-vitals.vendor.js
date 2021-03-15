/**
 * This comes from the google web-vital repository, base only script @ https://github.com/GoogleChrome/web-vitals
 */
(function () {

    /*
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     https://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    /**
     * Performantly generate a unique, 30-char string by combining a version
     * number, the current timestamp with a 13-digit number integer.
     * @return {string}
     */
    var generateUniqueID = function generateUniqueID() {
      return "v1-".concat(Date.now(), "-").concat(Math.floor(Math.random() * (9e12 - 1)) + 1e12);
    };

    /*
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     https://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    var initMetric = function initMetric(name, value) {
      return {
        name: name,
        value: typeof value === 'undefined' ? -1 : value,
        delta: 0,
        entries: [],
        id: generateUniqueID()
      };
    };

    /*
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     https://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    /**
     * Takes a performance entry type and a callback function, and creates a
     * `PerformanceObserver` instance that will observe the specified entry type
     * with buffering enabled and call the callback _for each entry_.
     *
     * This function also feature-detects entry support and wraps the logic in a
     * try/catch to avoid errors in unsupporting browsers.
     */
    var observe = function observe(type, callback) {
      try {
        if (PerformanceObserver.supportedEntryTypes.includes(type)) {
          var po = new PerformanceObserver(function (l) {
            return l.getEntries().map(callback);
          });
          po.observe({
            type: type,
            buffered: true
          });
          return po;
        }
      } catch (e) {// Do nothing.
      }

      return;
    };

    /*
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     https://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    var beforeUnloadFixAdded = false;
    var onHidden = function onHidden(cb, once) {
      // Adding a `beforeunload` listener is needed to fix this bug:
      // https://bugs.chromium.org/p/chromium/issues/detail?id=987409
      if (!beforeUnloadFixAdded && // Avoid adding this in Firefox as it'll break bfcache:
      // https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
      // @ts-ignore
      typeof InstallTrigger === 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        addEventListener('beforeunload', function () {});
        beforeUnloadFixAdded = true;
      }

      var onVisibilityChange = function onVisibilityChange(event) {
        if (document.visibilityState === 'hidden') {
          cb(event);

          if (once) {
            removeEventListener('visibilitychange', onVisibilityChange, true);
          }
        }
      };

      addEventListener('visibilitychange', onVisibilityChange, true);
    };

    /*
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     https://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    var onBFCacheRestore = function onBFCacheRestore(cb) {
      addEventListener('pageshow', function (event) {
        if (event.persisted) {
          cb(event);
        }
      }, true);
    };

    /*
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     https://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    var finalMetrics = typeof WeakSet === 'function' ? new WeakSet() : new Set();

    /*
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     https://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    var bindReporter = function bindReporter(callback, metric, reportAllChanges) {
      var prevValue;
      return function () {
        if (metric.value >= 0) {
          if (reportAllChanges || finalMetrics.has(metric) || document.visibilityState === 'hidden') {
            metric.delta = metric.value - (prevValue || 0); // Report the metric if there's a non-zero delta, if the metric is
            // final, or if no previous value exists (which can happen in the case
            // of the document becoming hidden when the metric value is 0).
            // See: https://github.com/GoogleChrome/web-vitals/issues/14

            if (metric.delta || prevValue === undefined) {
              prevValue = metric.value;
              callback(metric);
            }
          }
        }
      };
    };

    /*
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     https://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    var getCLS = function getCLS(onReport, reportAllChanges) {
      var metric = initMetric('CLS', 0);
      var report;

      var entryHandler = function entryHandler(entry) {
        // Only count layout shifts without recent user input.
        if (!entry.hadRecentInput) {
          metric.value += entry.value;
          metric.entries.push(entry);
          report();
        }
      };

      var po = observe('layout-shift', entryHandler);

      if (po) {
        report = bindReporter(onReport, metric, reportAllChanges);
        onHidden(function () {
          po.takeRecords().map(entryHandler);
          report();
        });
        onBFCacheRestore(function () {
          metric = initMetric('CLS', 0);
          report = bindReporter(onReport, metric, reportAllChanges);
        });
      }
    };

    /*
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     https://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    var firstHiddenTime = -1;

    var initHiddenTime = function initHiddenTime() {
      return document.visibilityState === 'hidden' ? 0 : Infinity;
    };

    var trackChanges = function trackChanges() {
      // Update the time if/when the document becomes hidden.
      onHidden(function (_ref) {
        var timeStamp = _ref.timeStamp;
        firstHiddenTime = timeStamp;
      }, true);
    };

    var getFirstHidden = function getFirstHidden() {
      if (firstHiddenTime < 0) {
        // If the document is hidden when this code runs, assume it was hidden
        // since navigation start. This isn't a perfect heuristic, but it's the
        // best we can do until an API is available to support querying past
        // visibilityState.
        {
          firstHiddenTime = self.webVitals.firstHiddenTime;

          if (firstHiddenTime === Infinity) {
            trackChanges();
          }
        } // Reset the time on bfcache restores.


        onBFCacheRestore(function () {
          // Schedule a task in order to track the `visibilityState` once it's
          // had an opportunity to change to visible in all browsers.
          // https://bugs.chromium.org/p/chromium/issues/detail?id=1133363
          setTimeout(function () {
            firstHiddenTime = initHiddenTime();
            trackChanges();
          }, 0);
        });
      }

      return {
        get timeStamp() {
          return firstHiddenTime;
        }

      };
    };

    /*
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     https://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    var getFCP = function getFCP(onReport, reportAllChanges) {
      var firstHidden = getFirstHidden();
      var metric = initMetric('FCP');
      var report;

      var entryHandler = function entryHandler(entry) {
        if (entry.name === 'first-contentful-paint') {
          if (po) {
            po.disconnect();
          } // Only report if the page wasn't hidden prior to the first paint.


          if (entry.startTime < firstHidden.timeStamp) {
            metric.value = entry.startTime;
            metric.entries.push(entry);
            finalMetrics.add(metric);
            report();
          }
        }
      };

      var po = observe('paint', entryHandler);

      if (po) {
        report = bindReporter(onReport, metric, reportAllChanges);
        onBFCacheRestore(function (event) {
          metric = initMetric('FCP');
          report = bindReporter(onReport, metric, reportAllChanges);
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              metric.value = performance.now() - event.timeStamp;
              finalMetrics.add(metric);
              report();
            });
          });
        });
      }
    };

    /*
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     https://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    var getFID = function getFID(onReport, reportAllChanges) {
      var firstHidden = getFirstHidden();
      var metric = initMetric('FID');
      var report;

      var entryHandler = function entryHandler(entry) {
        // Only report if the page wasn't hidden prior to the first input.
        if (entry.startTime < firstHidden.timeStamp) {
          metric.value = entry.processingStart - entry.startTime;
          metric.entries.push(entry);
          finalMetrics.add(metric);
          report();
        }
      };

      var po = observe('first-input', entryHandler);
      report = bindReporter(onReport, metric, reportAllChanges);

      if (po) {
        onHidden(function () {
          po.takeRecords().map(entryHandler);
          po.disconnect();
        }, true);
      }

      {
        // Prefer the native implementation if available,
        if (!po) {
          window.webVitals.firstInputPolyfill(entryHandler);
        }

        onBFCacheRestore(function () {
          metric = initMetric('FID');
          report = bindReporter(onReport, metric, reportAllChanges);
          window.webVitals.resetFirstInputPolyfill();
          window.webVitals.firstInputPolyfill(entryHandler);
        });
      }
    };

    /*
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     https://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    var getLCP = function getLCP(onReport, reportAllChanges) {
      var firstHidden = getFirstHidden();
      var metric = initMetric('LCP');
      var report;

      var entryHandler = function entryHandler(entry) {
        // The startTime attribute returns the value of the renderTime if it is not 0,
        // and the value of the loadTime otherwise.
        var value = entry.startTime; // If the page was hidden prior to paint time of the entry,
        // ignore it and mark the metric as final, otherwise add the entry.

        if (value < firstHidden.timeStamp) {
          metric.value = value;
          metric.entries.push(entry);
        }

        report();
      };

      var po = observe('largest-contentful-paint', entryHandler);

      if (po) {
        report = bindReporter(onReport, metric, reportAllChanges);

        var stopListening = function stopListening() {
          if (!finalMetrics.has(metric)) {
            po.takeRecords().map(entryHandler);
            po.disconnect();
            finalMetrics.add(metric);
            report();
          }
        }; // Stop listening after input. Note: while scrolling is an input that
        // stop LCP observation, it's unreliable since it can be programmatically
        // generated. See: https://github.com/GoogleChrome/web-vitals/issues/75


        ['keydown', 'click'].forEach(function (type) {
          addEventListener(type, stopListening, {
            once: true,
            capture: true
          });
        });
        onHidden(stopListening, true);
        onBFCacheRestore(function (event) {
          metric = initMetric('LCP');
          report = bindReporter(onReport, metric, reportAllChanges);
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              metric.value = performance.now() - event.timeStamp;
              finalMetrics.add(metric);
              report();
            });
          });
        });
      }
    };

    /*
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     https://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    var afterLoad = function afterLoad(callback) {
      if (document.readyState === 'complete') {
        // Queue a task so the callback runs after `loadEventEnd`.
        setTimeout(callback, 0);
      } else {
        // Use `pageshow` so the callback runs after `loadEventEnd`.
        addEventListener('pageshow', callback);
      }
    };

    var getNavigationEntryFromPerformanceTiming = function getNavigationEntryFromPerformanceTiming() {
      // Really annoying that TypeScript errors when using `PerformanceTiming`.
      var timing = performance.timing;
      var navigationEntry = {
        entryType: 'navigation',
        startTime: 0
      };

      for (var key in timing) {
        if (key !== 'navigationStart' && key !== 'toJSON') {
          navigationEntry[key] = Math.max(timing[key] - timing.navigationStart, 0);
        }
      }

      return navigationEntry;
    };

    var getTTFB = function getTTFB(onReport) {
      var metric = initMetric('TTFB');
      afterLoad(function () {
        try {
          // Use the NavigationTiming L2 entry if available.
          var navigationEntry = performance.getEntriesByType('navigation')[0] || getNavigationEntryFromPerformanceTiming();
          metric.value = metric.delta = navigationEntry.responseStart;
          metric.entries = [navigationEntry];
          onReport(metric);
        } catch (error) {// Do nothing.
        }
      });
    };

    window.webVitals.getCLS = getCLS;
    window.webVitals.getFCP = getFCP;
    window.webVitals.getFID = getFID;
    window.webVitals.getLCP = getLCP;
    window.webVitals.getTTFB = getTTFB;
}());
