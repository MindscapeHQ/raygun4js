/* globals describe, beforeEach, it, expect, browser */

var common = require("../common");

describe("XHR tracking", function() {
  beforeEach(function() {
    browser.url("http://localhost:4567/fixtures/breadcrumbs/automatic.xhr.html");
    browser.pause(8000);
  });

  it("tracks XHR start and end events", function() {
    var breadcrumbs = common.getBreadcrumbs();

    expect(breadcrumbs[0].type).toBe("request");
    expect(breadcrumbs[0].message).toContain("Opening request");

    expect(breadcrumbs[1].type).toBe("request");
    expect(breadcrumbs[1].message).toContain("Finished request");
  });
});
