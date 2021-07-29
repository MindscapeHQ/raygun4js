/**
 * web-vitals v2.1.0 polyfill
 * This comes from the google web-vital repository, polyfill script @https://github.com/GoogleChrome/web-vitals
 */

(function() {
  // Raygun: This ensures that we do not initialize Core Web Vitals for non-browser environments
  if (typeof document === 'undefined') {
    return;
  }

  var firstInputEvent;
  var firstInputDelay;
  var firstInputTimeStamp;
  var callbacks;
  var listenerOpts = { passive: true, capture: true };
  var startTimeStamp = new Date;
  var firstInputPolyfill = function firstInputPolyfill(onFirstInput) {
    callbacks.push(onFirstInput);
    reportFirstInputDelayIfRecordedAndValid();
  };
  var resetFirstInputPolyfill = function resetFirstInputPolyfill() {
    callbacks = [];
    firstInputDelay = -1;
    firstInputEvent = null;
    eachEventType(addEventListener);
  };
  var recordFirstInputDelay = function recordFirstInputDelay(delay, event) {
    if (!firstInputEvent) {
      firstInputEvent = event;
      firstInputDelay = delay;
      firstInputTimeStamp = new Date;
      eachEventType(removeEventListener);
      reportFirstInputDelayIfRecordedAndValid();
    }
  };
  var reportFirstInputDelayIfRecordedAndValid = function reportFirstInputDelayIfRecordedAndValid() {
    if (firstInputDelay >= 0 && firstInputDelay < firstInputTimeStamp - startTimeStamp) {
      var entry = {
        entryType: 'first-input',
        name: firstInputEvent.type,
        target: firstInputEvent.target,
        cancelable: firstInputEvent.cancelable,
        startTime: firstInputEvent.timeStamp,
        processingStart: firstInputEvent.timeStamp + firstInputDelay,
      };
      callbacks.forEach((function(callback) {
        callback(entry);
      }));
      callbacks = [];
    }
  };
  var onPointerDown = function onPointerDown(delay, event) {
    var onPointerUp = function onPointerUp() {
      recordFirstInputDelay(delay, event);
      removePointerEventListeners();
    };
    var onPointerCancel = function onPointerCancel() {
      removePointerEventListeners();
    };
    var removePointerEventListeners = function removePointerEventListeners() {
      removeEventListener('pointerup', onPointerUp, listenerOpts);
      removeEventListener('pointercancel', onPointerCancel, listenerOpts);
    };
    addEventListener('pointerup', onPointerUp, listenerOpts);
    addEventListener('pointercancel', onPointerCancel, listenerOpts);
  };
  var onInput = function onInput(event) {
    if (event.cancelable) {
      var isEpochTime = event.timeStamp > 1e12;
      var now = isEpochTime ? new Date : performance.now();
      var delay = now - event.timeStamp;
      if (event.type == 'pointerdown') {
        onPointerDown(delay, event);
      } else {
        recordFirstInputDelay(delay, event);
      }
    }
  };
  var eachEventType = function eachEventType(callback) {
    var eventTypes = ['mousedown', 'keydown', 'touchstart', 'pointerdown'];
    eventTypes.forEach((function(type) {
      return callback(type, onInput, listenerOpts);
    }));
  };
  var firstHiddenTime = document.visibilityState === 'hidden' ? 0 : Infinity;
  var onVisibilityChange = function onVisibilityChange(event) {
    if (document.visibilityState === 'hidden') {
      firstHiddenTime = event.timeStamp;
      removeEventListener('visibilitychange', onVisibilityChange, true);
    }
  };
  addEventListener('visibilitychange', onVisibilityChange, true);
  var getFirstHiddenTime = function getFirstHiddenTime() {
    return firstHiddenTime;
  };
  resetFirstInputPolyfill();
  self.webVitals = {
    firstInputPolyfill: firstInputPolyfill,
    resetFirstInputPolyfill: resetFirstInputPolyfill,
    get firstHiddenTime() {
      return getFirstHiddenTime();
    },
  };
})();

