/* globals describe, beforeEach, it, expect, browser */

var _ = require('underscore');
var common = require("../common");

function breadcrumbExists(type, message) {
  return _.any(common.getBreadcrumbs(), function(breadcrumb) {
    return breadcrumb.type === type && breadcrumb.message.indexOf(message) !== -1;
  });
}

describe("Navigation events", function() {
  beforeEach(function() {
    browser.url("http://localhost:4567/fixtures/breadcrumbs/automatic.navigation.html");
    browser.pause(8000);
  });

  it("records a page load breadcrumb first", function() {
    var breadcrumb = _.first(common.sentPayloads()[0].Details.Breadcrumbs);

    if (!common.isOldIE()) {
      expect(breadcrumb.type).toBe("navigation");
      expect(breadcrumb.message).toBe("Page loaded");
    }
  });

  it("records pageShown events", function() {
    if (!common.isOldIE() && !common.isIEVersion('10')) {
      expect(breadcrumbExists("navigation", "Page shown")).toBe(true);
    }
  });

  it("records replaceState events", function() {
    if (!common.isOldIE()) {
      expect(breadcrumbExists("navigation", "replaceState")).toBe(true);
    }
  });

  it("records pushState events", function() {
    if (!common.isOldIE()) {
      expect(breadcrumbExists("navigation", "pushState")).toBe(true);
    }
  });

  it("records popState events", function() {
    if (!common.isOldIE()) {
      expect(breadcrumbExists("navigation", "Navigated back")).toBe(true);
    }
  });

  it("records hashChange events", function() {
    // Despite hashchange event being supported by ie9 and tested working
    // the test doesn't pick up the hash change event
    if (!common.isOldIE()) {
      expect(breadcrumbExists("navigation", "Hash change")).toBe(true);
    }
  });
});
