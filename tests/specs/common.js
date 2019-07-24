/* globals browser, window */
var _ = require('underscore');

module.exports = {
  isIEVersion: function(version) {
    return browser.desiredCapabilities.browserName === 'internet explorer' &&
           browser.desiredCapabilities.version === version;
  },
  isOldIE: function() {
    return this.isIEVersion('9') || this.isIEVersion('10');
  },
  inFlightXHRs: function() {
    return browser.execute(function() {
      return window.__inFlightXHRs;
    }).value;
  },
  sentPayloads: function() {
    return browser.execute(function() {
      return window.__requestPayloads;
    }).value;
  },
  getBreadcrumbs: function() {
    var crumbs = browser.execute(function() {
      return window.__requestPayloads[0].Details.Breadcrumbs;
    }).value;

    return crumbs;
  },
  firstBreadcrumb: function() {
    return this.getBreadcrumbs()[0];
  },
  getLocalStorageValue: function(key) {
    return browser.execute(function (name) {
      return localStorage.getItem(name);
    }, key).value;
  },
  getSessionStorageValue: function(key) {
    return browser.execute(function (name) {
      return localStorage.getItem(name);
    }, key).value;
  },
  setCookieValue: function(key, value) {
    browser.execute(function(cookieName, cookieValue) {
      document.cookie = cookieName + '=' + cookieValue + '; path=/';
    }, key, value);
  },
  getCookieValue: function(key) {
    var cookieResult = browser.execute(function(name) {
        var nameEQ = name + '=';
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
    }, key).value;

    return cookieResult;
  }
};
