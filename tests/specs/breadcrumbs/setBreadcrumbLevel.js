/* globals describe, beforeEach, it, expect, browser */

var common = require("../common");

describe("Changing breadcrumbLevel", function() {
  beforeEach(async function() {
    await browser.url("http://localhost:4567/fixtures/breadcrumbs/setBreadcrumbLevel.html");
    await browser.pause(8000);
  });

  it("Only records the right breadcrumbs for the current level", async function() {
    var breadcrumbs = await common.getBreadcrumbs();

    expect(breadcrumbs[0].level).toBe("debug");
    expect(breadcrumbs[0].message).toContain("foo");

    expect(breadcrumbs[1].level).toBe("error");
    expect(breadcrumbs[1].message).toContain("foo");
  });
});
