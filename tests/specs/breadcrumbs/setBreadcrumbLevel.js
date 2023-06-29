/* globals describe, beforeEach, it, expect, browser */

var common = require("../common");

describe("Changing breadcrumbLevel", function() {
  beforeEach(function() {
    await browser.url("http://localhost:4567/fixtures/breadcrumbs/setBreadcrumbLevel.html");
    await browser.pause(8000);
  });

  it("Only records the right breadcrumbs for the current level", function() {
    var breadcrumbs = await common.getBreadcrumbs();

    await expect(breadcrumbs[0].level).toBe("debug");
    await expect(breadcrumbs[0].message).toContain("foo");

    await expect(breadcrumbs[1].level).toBe("error");
    await expect(breadcrumbs[1].message).toContain("foo");
  });
});
