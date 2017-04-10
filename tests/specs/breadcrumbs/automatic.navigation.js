/* globals describe, beforeEach, it, expect, browser */

var _ = require('underscore');
var common = require("../common");

describe("Navigation events", function() {
  beforeEach(function() {
    browser.url("http://localhost:4567/fixtures/breadcrumbs/automatic.navigation.html");
    browser.pause(4000);
  });

  it("records a page load breadcrumb first", function() {
    var breadcrumb = _.first(common.sentPayloads()[0].Details.Breadcrumbs);

    expect(breadcrumb.type).toBe("navigation");
    expect(breadcrumb.message).toBe("Page loaded");
  });

  it("records replaceState events", function() {
    var breadcrumb = common.getBreadcrumbs()[0];

    if (!common.isOldIE()) {
      expect(breadcrumb.type).toBe("navigation");
      expect(breadcrumb.message).toContain("replaceState");
    }
  });

  it("records pushState events", function() {
    var breadcrumb = common.getBreadcrumbs()[1];

    if (!common.isOldIE()) {
      expect(breadcrumb.type).toBe("navigation");
      expect(breadcrumb.message).toContain("pushState");
    }
  });

  it("records popState events", function() {
    var breadcrumb = common.getBreadcrumbs()[2];

    if (!common.isOldIE()) {
      expect(breadcrumb.type).toBe("navigation");
      expect(breadcrumb.message).toBe("Navigated back");
    }
  });

  it("records hashChange events", function() {
    var breadcrumb = common.getBreadcrumbs()[3];

    // Despite hashchange event being supported by ie9 and tested working
    // the test doesn't pick up the hash change event
    if (!common.isOldIE()) {
      expect(breadcrumb.type).toBe("navigation");
      expect(breadcrumb.message).toBe("Hash change");
    }
  });
});
