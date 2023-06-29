/* globals describe, beforeEach, it, expect, browser */

var _ = require('underscore');
var common = require("../common");

async function breadcrumbExists(type, message) {
  return _.any(await common.getBreadcrumbs(), function(breadcrumb) {
    return breadcrumb.type === type && breadcrumb.message.indexOf(message) !== -1;
  });
}

describe("Navigation events", function() {
  beforeEach(function() {
    await browser.url("http://localhost:4567/fixtures/breadcrumbs/automatic.navigation.html");
    await browser.pause(8000);
  });

  it("records a page load breadcrumb first", function() {
    var breadcrumb = await _.first((await common.sentPayloads())[0].Details.Breadcrumbs);

    if (!(await common.isOldIE())) {
      await expect(breadcrumb.type).toBe("navigation");
      await expect(breadcrumb.message).toBe("Page loaded");
    }
  });

  it("records pageShown events", function() {
    if (!(await common.isOldIE()) && !(await common.isIEVersion('10'))) {
      await expect(await breadcrumbExists("navigation", "Page shown")).toBe(true);
    }
  });

  it("records replaceState events", function() {
    if (!(await common.isOldIE())) {
      await expect(await breadcrumbExists("navigation", "replaceState")).toBe(true);
    }
  });

  it("records pushState events", function() {
    if (!(await common.isOldIE())) {
      await expect(await breadcrumbExists("navigation", "pushState")).toBe(true);
    }
  });

  it("records popState events", function() {
    if (!(await common.isOldIE())) {
      await expect(await breadcrumbExists("navigation", "Navigated back")).toBe(true);
    }
  });

  it("records hashChange events", function() {
    // Despite hashchange event being supported by ie9 and tested working
    // the test doesn't pick up the hash change event
    if (!(await common.isOldIE())) {
      await expect(await breadcrumbExists("navigation", "Hash change")).toBe(true);
    }
  });
});
