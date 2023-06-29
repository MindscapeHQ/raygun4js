/* globals describe, beforeEach, it, expect, browser */

var common = require("../common");

describe("Element clicking", function() {
  beforeEach(function() {
    await browser.url("http://localhost:4567/fixtures/breadcrumbs/automatic.element.html");
    await browser.pause(4000);
  });

  it("logs the element that was clicked", function() {
    var breadcrumb = (await common.getBreadcrumbs())[0];

    await expect(breadcrumb.type).toBe("click-event");
    await expect(breadcrumb.message).toBe("UI Click");
  });

  it("logs the element selector that was clicked", function() {
    var breadcrumb = (await common.getBreadcrumbs())[0];

    await expect(await breadcrumb.CustomData.selector).toBe("A#foo");
  });

  it("logs the element text that was clicked", function() {
    var breadcrumb = (await common.getBreadcrumbs())[0];

    await expect(breadcrumb.CustomData.text).toBe("Click me");
  });
});
