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

  it("works when the responseType is non text", function() {
    var breadcrumbs = common.getBreadcrumbs();

    expect(breadcrumbs[2].type).toBe("request");
    expect(breadcrumbs[2].message).toContain("Opening request");

    expect(breadcrumbs[3].type).toBe("request");
    expect(breadcrumbs[3].message).toContain("Finished request");
  });

  it("does not log bodies when logXhrContents is false", function() {
    var breadcrumbs = common.getBreadcrumbs();

    expect(breadcrumbs[0].CustomData.requestText).toBe(undefined);
    expect(breadcrumbs[1].CustomData.responseText).toBe("Disabled");
  });

  it("does log bodies when logXhrContents is true", function() {
    var breadcrumbs = common.getBreadcrumbs();

    expect(breadcrumbs[2].CustomData.requestText).toContain('foo');
    expect(breadcrumbs[3].CustomData.responseText).toContain("N/A");
  });
});
