/* globals describe, beforeEach, it, expect, browser */

var common = require("../common");

describe("Console logging", function() {
  beforeEach(function() {
    await browser.url("http://localhost:4567/fixtures/breadcrumbs/automatic.console.html");
    await browser.pause(4000);
  });

  // Don't work in IE9 for some reason
  // console object gets correctly enhanced ¯\_(ツ)_/¯
  if (!(await common.isOldIE())) {
    it("records log message", function() {
      var breadcrumb = (await common.getBreadcrumbs())[0];

      await expect(breadcrumb.type).toBe("console");
      await expect(breadcrumb.message).toBe("log");
    });

    it("records warn message", function() {
      var breadcrumb = (await common.getBreadcrumbs())[1];

      await expect(breadcrumb.type).toBe("console");
      await expect(breadcrumb.message).toBe("warn");
    });

    it("records error message", function() {
      var breadcrumb = (await common.getBreadcrumbs())[2];

      await expect(breadcrumb.type).toBe("console");
      await expect(breadcrumb.message).toBe("error");
    });
  }
});
