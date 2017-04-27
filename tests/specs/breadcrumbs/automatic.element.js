/* globals describe, beforeEach, it, expect, browser */

var common = require("../common");

describe("Element clicking", function() {
  beforeEach(function() {
    browser.url("http://localhost:4567/fixtures/breadcrumbs/automatic.element.html");
    browser.pause(4000);
  });

  it("logs the element that was clicked", function() {
    var breadcrumb = common.getBreadcrumbs()[0];

    expect(breadcrumb.type).toBe("click-event");
    expect(breadcrumb.message).toBe("UI Click");
  });

  it("logs the element selector that was clicked", function() {
    var breadcrumb = common.getBreadcrumbs()[0];

    expect(breadcrumb.CustomData.selector).toBe("A#foo");
  });

  it("logs the element text that was clicked", function() {
    var breadcrumb = common.getBreadcrumbs()[0];

    expect(breadcrumb.CustomData.text).toBe("Click me");
  });
});
