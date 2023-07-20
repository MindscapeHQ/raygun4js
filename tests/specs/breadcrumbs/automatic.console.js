/* globals describe, beforeEach, it, expect, browser */

var common = require("../common");

describe("Console logging",  () => {
    beforeEach(async function () {
      await browser.url("http://localhost:4567/fixtures/breadcrumbs/automatic.console.html");
      await browser.pause(4000);
    });

    // Don't work in IE9 for some reason
    // console object gets correctly enhanced ¯\_(ツ)_/¯
    if (!( common.isOldIE())) {
      it("records log message", async function () {
        var breadcrumb = (await common.getBreadcrumbs())[0];

        expect(breadcrumb.type).toBe("console");
        expect(breadcrumb.message).toBe("log");
      });

      it("records warn message", async function () {
        var breadcrumb = (await common.getBreadcrumbs())[1];

        expect(breadcrumb.type).toBe("console");
        expect(breadcrumb.message).toBe("warn");
      });

      it("records error message", async function () {
        var breadcrumb = (await common.getBreadcrumbs())[2];

        expect(breadcrumb.type).toBe("console");
        expect(breadcrumb.message).toBe("error");
      });
    }
  });
