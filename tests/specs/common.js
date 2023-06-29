/* globals browser, window */
var _ = require('underscore');

module.exports = {
  isIEVersion: function(version) {
    return browser.capabilities.browserName === 'internet explorer' &&
           browser.capabilities.browserVersion === version;
  },
  isOldIE: function() {
    return (await this.isIEVersion('9')) || (await this.isIEVersion('10'));
  },
  inFlightXHRs: function() {
    return browser.execute(function() {
      return window.__inFlightXHRs;
    });
  },
  sentPayloads: function() {
    return browser.execute(function() {
      return window.__requestPayloads;
    });
  },
  getBreadcrumbs: function(pulseEnabled = false) {
    var crumbs = await browser.execute(function(pulseEnabled) {
      return pulseEnabled ?
        window.__requestPayloads[(window.__requestPayloads.length - 1)].Details.Breadcrumbs :
        window.__requestPayloads[0].Details.Breadcrumbs ;
    }, pulseEnabled);

    return crumbs;
  },
  firstBreadcrumb: function() {
    return (await this.getBreadcrumbs())[0];
  },
  getLocalStorageValue: function(key) {
    return browser.execute(function (name) {
      return localStorage.getItem(name);
    }, key);
  },
  getSessionStorageValue: function(key) {
    return browser.execute(function (name) {
      return localStorage.getItem(name);
    }, key);
  },
  setCookieValue: function(key, value) {
    await browser.execute(function(cookieName, cookieValue) {
      document.cookie = cookieName + '=' + cookieValue + '; path=/';
    }, key, value);
  },
  getCookieValue: function(key) {
    var cookieResult = await browser.execute(function(name) {
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
    }, key);

    return cookieResult;
  }
};
