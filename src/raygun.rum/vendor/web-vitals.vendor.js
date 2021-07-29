/**
 * web-vitals v2.1.0
 * This comes from the google web-vital repository, base only script @https://github.com/GoogleChrome/web-vitals
 */

(function(exports) {
  'use strict';

  // Raygun: This ensures that we do not initialize Core Web Vitals for non-browser environments
  if (typeof document === 'undefined') {
    return;
  }

  var generateUniqueID = function generateUniqueID() {
    return 'v2-'.concat(Date.now(), '-').concat(Math.floor(Math.random() * (9e12 - 1)) + 1e12);
  };
  var initMetric = function initMetric(name, value) {
    return {
      name: name,
      value: typeof value === 'undefined' ? -1 : value,
      delta: 0,
      entries: [],
      id: generateUniqueID(),
    };
  };
  var observe = function observe(type, callback) {
    try {
      if (PerformanceObserver.supportedEntryTypes.includes(type)) {
        if (type === 'first-input' && !('PerformanceEventTiming' in self)) {
          return;
        }
        var po = new PerformanceObserver((function(l) {
          return l.getEntries().map(callback);
        }));
        po.observe({ type: type, buffered: true });
        return po;
      }
    } catch (e) {
    }
    return;
  };
  var onHidden = function onHidden(cb, once) {
    var onHiddenOrPageHide = function onHiddenOrPageHide(event) {
      if (event.type === 'pagehide' || document.visibilityState === 'hidden') {
        cb(event);
        if (once) {
          removeEventListener('visibilitychange', onHiddenOrPageHide, true);
          removeEventListener('pagehide', onHiddenOrPageHide, true);
        }
      }
    };
    addEventListener('visibilitychange', onHiddenOrPageHide, true);
    addEventListener('pagehide', onHiddenOrPageHide, true);
  };
  var onBFCacheRestore = function onBFCacheRestore(cb) {
    addEventListener('pageshow', (function(event) {
      if (event.persisted) {
        cb(event);
      }
    }), true);
  };
  var bindReporter = function bindReporter(callback, metric, reportAllChanges) {
    var prevValue;
    return function(forceReport) {
      if (metric.value >= 0) {
        if (forceReport || reportAllChanges) {
          metric.delta = metric.value - (prevValue || 0);
          if (metric.delta || prevValue === undefined) {
            prevValue = metric.value;
            callback(metric);
          }
        }
      }
    };
  };
  var firstHiddenTime = -1;
  var initHiddenTime = function initHiddenTime() {
    return document.visibilityState === 'hidden' ? 0 : Infinity;
  };
  var trackChanges = function trackChanges() {
    onHidden((function(_ref) {
      var timeStamp = _ref.timeStamp;
      firstHiddenTime = timeStamp;
    }), true);
  };
  var getVisibilityWatcher = function getVisibilityWatcher() {
    if (firstHiddenTime < 0) {
      {
        firstHiddenTime = self.webVitals.firstHiddenTime;
        if (firstHiddenTime === Infinity) {
          trackChanges();
        }
      }
      onBFCacheRestore((function() {
        setTimeout((function() {
          firstHiddenTime = initHiddenTime();
          trackChanges();
        }), 0);
      }));
    }
    return {
      get firstHiddenTime() {
        return firstHiddenTime;
      },
    };
  };
  var getFCP = function getFCP(onReport, reportAllChanges) {
    var visibilityWatcher = getVisibilityWatcher();
    var metric = initMetric('FCP');
    var report;
    var entryHandler = function entryHandler(entry) {
      if (entry.name === 'first-contentful-paint') {
        if (po) {
          po.disconnect();
        }
        if (entry.startTime < visibilityWatcher.firstHiddenTime) {
          metric.value = entry.startTime;
          metric.entries.push(entry);
          report(true);
        }
      }
    };
    var fcpEntry = performance.getEntriesByName && performance.getEntriesByName('first-contentful-paint')[0];
    var po = fcpEntry ? null : observe('paint', entryHandler);
    if (fcpEntry || po) {
      report = bindReporter(onReport, metric, reportAllChanges);
      if (fcpEntry) {
        entryHandler(fcpEntry);
      }
      onBFCacheRestore((function(event) {
        metric = initMetric('FCP');
        report = bindReporter(onReport, metric, reportAllChanges);
        requestAnimationFrame((function() {
          requestAnimationFrame((function() {
            metric.value = performance.now() - event.timeStamp;
            report(true);
          }));
        }));
      }));
    }
  };
  var isMonitoringFCP = false;
  var fcpValue = -1;
  var getCLS = function getCLS(onReport, reportAllChanges) {
    if (!isMonitoringFCP) {
      getFCP((function(metric) {
        fcpValue = metric.value;
      }));
      isMonitoringFCP = true;
    }
    var onReportWrapped = function onReportWrapped(arg) {
      if (fcpValue > -1) {
        onReport(arg);
      }
    };
    var metric = initMetric('CLS', 0);
    var report;
    var sessionValue = 0;
    var sessionEntries = [];
    var entryHandler = function entryHandler(entry) {
      if (!entry.hadRecentInput) {
        var firstSessionEntry = sessionEntries[0];
        var lastSessionEntry = sessionEntries[sessionEntries.length - 1];
        if (sessionValue && entry.startTime - lastSessionEntry.startTime < 1e3 && entry.startTime - firstSessionEntry.startTime < 5e3) {
          sessionValue += entry.value;
          sessionEntries.push(entry);
        } else {
          sessionValue = entry.value;
          sessionEntries = [entry];
        }
        if (sessionValue > metric.value) {
          metric.value = sessionValue;
          metric.entries = sessionEntries;
          report();
        }
      }
    };
    var po = observe('layout-shift', entryHandler);
    if (po) {
      report = bindReporter(onReportWrapped, metric, reportAllChanges);
      onHidden((function() {
        po.takeRecords().map(entryHandler);
        report(true);
      }));
      onBFCacheRestore((function() {
        sessionValue = 0;
        fcpValue = -1;
        metric = initMetric('CLS', 0);
        report = bindReporter(onReportWrapped, metric, reportAllChanges);
      }));
    }
  };
  var getFID = function getFID(onReport, reportAllChanges) {
    var visibilityWatcher = getVisibilityWatcher();
    var metric = initMetric('FID');
    var report;
    var entryHandler = function entryHandler(entry) {
      if (entry.startTime < visibilityWatcher.firstHiddenTime) {
        metric.value = entry.processingStart - entry.startTime;
        metric.entries.push(entry);
        report(true);
      }
    };
    var po = observe('first-input', entryHandler);
    report = bindReporter(onReport, metric, reportAllChanges);
    if (po) {
      onHidden((function() {
        po.takeRecords().map(entryHandler);
        po.disconnect();
      }), true);
    }
    {
      if (!po) {
        window.webVitals.firstInputPolyfill(entryHandler);
      }
      onBFCacheRestore((function() {
        metric = initMetric('FID');
        report = bindReporter(onReport, metric, reportAllChanges);
        window.webVitals.resetFirstInputPolyfill();
        window.webVitals.firstInputPolyfill(entryHandler);
      }));
    }
  };
  var reportedMetricIDs = new Set;
  var getLCP = function getLCP(onReport, reportAllChanges) {
    var visibilityWatcher = getVisibilityWatcher();
    var metric = initMetric('LCP');
    var report;
    var entryHandler = function entryHandler(entry) {
      var value = entry.startTime;
      if (value < visibilityWatcher.firstHiddenTime) {
        metric.value = value;
        metric.entries.push(entry);
      }
      report();
    };
    var po = observe('largest-contentful-paint', entryHandler);
    if (po) {
      report = bindReporter(onReport, metric, reportAllChanges);
      var stopListening = function stopListening() {
        if (!reportedMetricIDs.has(metric.id)) {
          po.takeRecords().map(entryHandler);
          po.disconnect();
          reportedMetricIDs.add(metric.id);
          report(true);
        }
      };
      ['keydown', 'click'].forEach((function(type) {
        addEventListener(type, stopListening, { once: true, capture: true });
      }));
      onHidden(stopListening, true);
      onBFCacheRestore((function(event) {
        metric = initMetric('LCP');
        report = bindReporter(onReport, metric, reportAllChanges);
        requestAnimationFrame((function() {
          requestAnimationFrame((function() {
            metric.value = performance.now() - event.timeStamp;
            reportedMetricIDs.add(metric.id);
            report(true);
          }));
        }));
      }));
    }
  };
  var afterLoad = function afterLoad(callback) {
    if (document.readyState === 'complete') {
      setTimeout(callback, 0);
    } else {
      addEventListener('pageshow', callback);
    }
  };
  var getNavigationEntryFromPerformanceTiming = function getNavigationEntryFromPerformanceTiming() {
    var timing = performance.timing;
    var navigationEntry = { entryType: 'navigation', startTime: 0 };
    for (var key in timing) {
      if (key !== 'navigationStart' && key !== 'toJSON') {
        navigationEntry[key] = Math.max(timing[key] - timing.navigationStart, 0);
      }
    }
    return navigationEntry;
  };
  var getTTFB = function getTTFB(onReport) {
    var metric = initMetric('TTFB');
    afterLoad((function() {
      try {
        var navigationEntry = performance.getEntriesByType('navigation')[0] || getNavigationEntryFromPerformanceTiming();
        metric.value = metric.delta = navigationEntry.responseStart;
        if (metric.value < 0) return;
        metric.entries = [navigationEntry];
        onReport(metric);
      } catch (error) {
      }
    }));
  };
  exports.getCLS = getCLS;
  exports.getFCP = getFCP;
  exports.getFID = getFID;
  exports.getLCP = getLCP;
  exports.getTTFB = getTTFB;
  Object.defineProperty(exports, '__esModule', { value: true });
})(this.webVitals = this.webVitals || {});


