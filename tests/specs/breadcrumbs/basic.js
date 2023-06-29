/* globals describe, beforeEach, it, expect, browser */

var _ = require('underscore');
var common = require("../common");

describe("Recording a basic breadcrumb", function() {
  beforeEach(function() {
    await browser.url("http://localhost:4567/fixtures/breadcrumbs/basic.html");
    await browser.pause(2000);
  });

  it("adds the breadcrumb to the payload", function() {
    var sentPayloads = await common.sentPayloads();

    await expect(await _.any(sentPayloads, function(payload) {
      return !!payload.Details.Breadcrumbs;
    })).toBe(true);
  });

  it("has the correct message", function() {
    await expect((await common.firstBreadcrumb()).message).toBe("a message");
  });

  it("can take metadata", function() {
    await expect((await common.firstBreadcrumb()).CustomData).toEqual({customData: true});
  });
});

describe("Recording a basic breadcrumb with an object", function() {
  beforeEach(function() {
    await browser.url("http://localhost:4567/fixtures/breadcrumbs/basicWithObject.html");
    await browser.pause(4000);
  });

  it("merges the passed object with the default crumb", function() {
    var breadcrumb = await common.firstBreadcrumb();

    var keys = Object.keys(breadcrumb).sort();
    var expectedKeys = [
      'level',
      'timestamp',
      'message',
      'CustomData',
      'category',
      'type'
    ].sort();

    await expect(keys).toEqual(expectedKeys);
  });
});
