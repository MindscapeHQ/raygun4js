/**
 * Extended support for backtraces and global error handling for most
 * asynchronous jQuery functions.
 */
(function traceKitAsyncForjQuery($, TraceKit) {
  'use strict';
  // quit if jQuery isn't on the page
  if (!$ || !$.event || !$.event.add) {
    return;
  }

  var _oldEventAdd = $.event.add;
  $.event.add = function traceKitEventAdd(elem, types, handler, data, selector) {
    if (typeof handler !== 'function' && typeof handler.handler !== 'function') {
      _oldEventAdd.call(this, elem, types, handler, data, selector);
    }

    var _handler;

    if (handler.handler) {
      _handler = handler.handler;
      handler.handler = TraceKit.wrap(handler.handler);
    } else {
      _handler = handler;
      handler = TraceKit.wrap(handler);
    }

    // If the handler we are attaching doesn’t have the same guid as
    // the original, it will never be removed when someone tries to
    // unbind the original function later. Technically as a result of
    // this our guids are no longer globally unique, but whatever, that
    // never hurt anybody RIGHT?!
    if (_handler.guid) {
      handler.guid = _handler.guid;
    } else {
      handler.guid = _handler.guid = $.guid++;
    }

    return _oldEventAdd.call(this, elem, types, handler, data, selector);
  };

  var _oldReady = $.fn.ready;
  $.fn.ready = function traceKitjQueryReadyWrapper(fn) {
    return _oldReady.call(this, TraceKit.wrap(fn));
  };

  var _oldAjax = $.ajax;
  $.ajax = function traceKitAjaxWrapper(url, options) {
    if (typeof url === "object") {
      options = url;
      url = undefined;
    }

    options = options || {};

    var keys = ['complete', 'error', 'success'], key;
    while(key = keys.pop()) {
      if ($.isFunction(options[key])) {
        options[key] = TraceKit.wrap(options[key]);
      }
    }

    try {
      return (url) ? _oldAjax.call(this, url, options) : _oldAjax.call(this, options);
    } catch (e) {
      TraceKit.report(e);
      throw e;
    }
  };

}(window.jQuery, window.TraceKit));
