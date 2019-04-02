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
  }
};
