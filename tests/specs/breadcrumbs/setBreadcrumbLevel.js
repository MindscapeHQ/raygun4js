/* globals describe, beforeEach, it, expect, browser */

var common = require("../common");

describe("Changing breadcrumbLevel", function() {
  beforeEach(function() {
    browser.url("http://localhost:4567/fixtures/breadcrumbs/setBreadcrumbLevel.html");
    browser.pause(8000);
  });

  it("Only records the right breadcrumbs for the current level", function() {
    var breadcrumbs = common.getBreadcrumbs();

    expect(breadcrumbs[0].level).toBe("debug");
    expect(breadcrumbs[0].message).toContain("foo");

    expect(breadcrumbs[1].level).toBe("error");
    expect(breadcrumbs[1].message).toContain("foo");
  });
});
