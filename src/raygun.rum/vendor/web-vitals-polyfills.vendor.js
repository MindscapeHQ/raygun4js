(function () {

    if(typeof document === 'undefined') {
      return;
    }

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
    var firstInputEvent;
    var firstInputDelay;
    var firstInputTimeStamp;
    var callbacks;
    var listenerOpts = {
      passive: true,
      capture: true
    };
    var startTimeStamp = new Date();
    /**
     * Accepts a callback to be invoked once the first input delay and event
     * are known.
     */

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
    /**
     * Records the first input delay and event, so subsequent events can be
     * ignored. All added event listeners are then removed.
     */

    var recordFirstInputDelay = function recordFirstInputDelay(delay, event) {
      if (!firstInputEvent) {
        firstInputEvent = event;
        firstInputDelay = delay;
        firstInputTimeStamp = new Date();
        eachEventType(removeEventListener);
        reportFirstInputDelayIfRecordedAndValid();
      }
    };
    /**
     * Reports the first input delay and event (if they're recorded and valid)
     * by running the array of callback functions.
     */


    var reportFirstInputDelayIfRecordedAndValid = function reportFirstInputDelayIfRecordedAndValid() {
      // In some cases the recorded delay is clearly wrong, e.g. it's negative
      // or it's larger than the delta between now and initialization.
      // - https://github.com/GoogleChromeLabs/first-input-delay/issues/4
      // - https://github.com/GoogleChromeLabs/first-input-delay/issues/6
      // - https://github.com/GoogleChromeLabs/first-input-delay/issues/7
      if (firstInputDelay >= 0 && // @ts-ignore (subtracting two dates always returns a number)
      firstInputDelay < firstInputTimeStamp - startTimeStamp) {
        var entry = {
          entryType: 'first-input',
          name: firstInputEvent.type,
          target: firstInputEvent.target,
          cancelable: firstInputEvent.cancelable,
          startTime: firstInputEvent.timeStamp,
          processingStart: firstInputEvent.timeStamp + firstInputDelay
        };
        callbacks.forEach(function (callback) {
          callback(entry);
        });
        callbacks = [];
      }
    };
    /**
     * Handles pointer down events, which are a special case.
     * Pointer events can trigger main or compositor thread behavior.
     * We differentiate these cases based on whether or not we see a
     * 'pointercancel' event, which are fired when we scroll. If we're scrolling
     * we don't need to report input delay since FID excludes scrolling and
     * pinch/zooming.
     */


    var onPointerDown = function onPointerDown(delay, event) {
      /**
       * Responds to 'pointerup' events and records a delay. If a pointer up event
       * is the next event after a pointerdown event, then it's not a scroll or
       * a pinch/zoom.
       */
      var onPointerUp = function onPointerUp() {
        recordFirstInputDelay(delay, event);
        removePointerEventListeners();
      };
      /**
       * Responds to 'pointercancel' events and removes pointer listeners.
       * If a 'pointercancel' is the next event to fire after a pointerdown event,
       * it means this is a scroll or pinch/zoom interaction.
       */


      var onPointerCancel = function onPointerCancel() {
        removePointerEventListeners();
      };
      /**
       * Removes added pointer event listeners.
       */


      var removePointerEventListeners = function removePointerEventListeners() {
        removeEventListener('pointerup', onPointerUp, listenerOpts);
        removeEventListener('pointercancel', onPointerCancel, listenerOpts);
      };

      addEventListener('pointerup', onPointerUp, listenerOpts);
      addEventListener('pointercancel', onPointerCancel, listenerOpts);
    };
    /**
     * Handles all input events and records the time between when the event
     * was received by the operating system and when it's JavaScript listeners
     * were able to run.
     */


    var onInput = function onInput(event) {
      // Only count cancelable events, which should trigger behavior
      // important to the user.
      if (event.cancelable) {
        // In some browsers `event.timeStamp` returns a `DOMTimeStamp` value
        // (epoch time) instead of the newer `DOMHighResTimeStamp`
        // (document-origin time). To check for that we assume any timestamp
        // greater than 1 trillion is a `DOMTimeStamp`, and compare it using
        // the `Date` object rather than `performance.now()`.
        // - https://github.com/GoogleChromeLabs/first-input-delay/issues/4
        var isEpochTime = event.timeStamp > 1e12;
        var now = isEpochTime ? new Date() : performance.now(); // Input delay is the delta between when the system received the event
        // (e.g. event.timeStamp) and when it could run the callback (e.g. `now`).

        var delay = now - event.timeStamp;

        if (event.type == 'pointerdown') {
          onPointerDown(delay, event);
        } else {
          recordFirstInputDelay(delay, event);
        }
      }
    };
    /**
     * Invokes the passed callback const for =  each event type with t =>he
     * `onInput` const and =  `listenerOpts =>`.
     */


    var eachEventType = function eachEventType(callback) {
      var eventTypes = ['mousedown', 'keydown', 'touchstart', 'pointerdown'];
      eventTypes.forEach(function (type) {
        return callback(type, onInput, listenerOpts);
      });
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
    var firstHiddenTime = document.visibilityState === 'hidden' ? 0 : Infinity;

    var onVisibilityChange = function onVisibilityChange(event) {
      if (document.visibilityState === 'hidden') {
        firstHiddenTime = event.timeStamp;
        removeEventListener('visibilitychange', onVisibilityChange, true);
      }
    }; // Note: do not add event listeners unconditionally (outside of polyfills).


    addEventListener('visibilitychange', onVisibilityChange, true);
    var getFirstHiddenTime = function getFirstHiddenTime() {
      return firstHiddenTime;
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
    resetFirstInputPolyfill();
    self.webVitals = {
      firstInputPolyfill: firstInputPolyfill,
      resetFirstInputPolyfill: resetFirstInputPolyfill,

      // TODO: in v2 this should just be `getFirstHiddenTime()`,
      // but in v1 it needs to be a getter to avoid creating a breaking change.
      get firstHiddenTime() {
        return getFirstHiddenTime();
      }

    };

}());
