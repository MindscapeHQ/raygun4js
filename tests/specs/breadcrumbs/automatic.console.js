/* globals describe, beforeEach, it, expect, browser */

var common = require("../common");

describe("Console logging", function() {
  beforeEach(function() {
    browser.url("http://localhost:4567/fixtures/breadcrumbs/automatic.console.html");
    browser.pause(4000);
  });

  // Don't work in IE9 for some reason
  // console object gets correctly enhanced ¯\_(ツ)_/¯
  if (!common.isOldIE()) {
    it("records log message", function() {
      var breadcrumb = common.getBreadcrumbs()[0];

      expect(breadcrumb.type).toBe("console");
      expect(breadcrumb.message).toBe("log");
    });

    it("records warn message", function() {
      var breadcrumb = common.getBreadcrumbs()[1];

      expect(breadcrumb.type).toBe("console");
      expect(breadcrumb.message).toBe("warn");
    });

    it("records error message", function() {
      var breadcrumb = common.getBreadcrumbs()[2];

      expect(breadcrumb.type).toBe("console");
      expect(breadcrumb.message).toBe("error");
    });
  }
});
