/* globals describe, beforeEach, it, expect, browser */

var _ = require('underscore');
var common = require("../common");

async function breadcrumbExists(type, message) {
  return _.any(await common.getBreadcrumbs(), function(breadcrumb) {
    return breadcrumb.type === type && breadcrumb.message.indexOf(message) !== -1;
  });
}

describe("Navigation events", function() {
  beforeEach(async function() {
    await browser.url("http://localhost:4567/fixtures/breadcrumbs/automatic.navigation.html");
    await browser.pause(8000);
  });

  it("records a page load breadcrumb first", async function() {
    var breadcrumb = await _.first((await common.sentPayloads())[0].Details.Breadcrumbs);

    if (!common.isOldIE()) {
      expect(breadcrumb.type).toBe("navigation");
      expect(breadcrumb.message).toBe("Page loaded");
    }
  });

  it("records pageShown events", async function() {
    if (!common.isOldIE() && !common.isIEVersion('10')) {
      expect(await breadcrumbExists("navigation", "Page shown")).toBe(true);
    }
  });

  it("records replaceState events", async function() {
    if (!common.isOldIE()) {
      expect(await breadcrumbExists("navigation", "replaceState")).toBe(true);
    }
  });

  it("records pushState events", async function() {
    if (!common.isOldIE()) {
      expect(await breadcrumbExists("navigation", "pushState")).toBe(true);
    }
  });

  it("records popState events", async function() {
    if (!common.isOldIE()) {
      expect(await breadcrumbExists("navigation", "Navigated back")).toBe(true);
    }
  });

  it("records hashChange events", async function() {
    // Despite hashchange event being supported by ie9 and tested working
    // the test doesn't pick up the hash change event
    if (!common.isOldIE()) {
      expect(await breadcrumbExists("navigation", "Hash change")).toBe(true);
    }
  });
});
