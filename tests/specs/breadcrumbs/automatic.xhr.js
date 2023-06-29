/* globals describe, beforeEach, it, expect, browser, window */

var _ = require('underscore');
var common = require("../common");

describe("XHR tracking", function() {
  beforeEach(function() {
    await browser.url("http://localhost:4567/fixtures/breadcrumbs/automatic.xhr.html");
    await browser.pause(2000);
  });

  it("tracks XHR start and end events", function() {
    var breadcrumbs = await common.getBreadcrumbs(true);

    await expect(breadcrumbs[0].type).toBe("request");
    await expect(breadcrumbs[0].message).toContain("Opening request");

    await expect(breadcrumbs[1].type).toBe("request");
    await expect(breadcrumbs[1].message).toContain("Finished request");
  });

  it("works when the responseType is non text", function() {
    var breadcrumbs = await common.getBreadcrumbs(true);

    await expect(breadcrumbs[2].type).toBe("request");
    await expect(breadcrumbs[2].message).toContain("Opening request");

    await expect(breadcrumbs[4].type).toBe("request");
    await expect(breadcrumbs[4].message).toContain("Finished request");
  });

  it("records the correct message with the URL", function() {
    var breadcrumbs = await common.getBreadcrumbs(true);

    await expect(breadcrumbs[0].message).toBe("Opening request to http://localhost:4567/fixtures/breadcrumbs/automatic.console.html");
  });

  it("records the correct requestURL", function() {
    var breadcrumbs = await common.getBreadcrumbs(true);

    await expect(breadcrumbs[0].CustomData.requestURL).toBe("http://localhost:4567/fixtures/breadcrumbs/automatic.console.html");
  });

  it("records the correct requestURL for absolute paths", function() {
    var breadcrumbs = await common.getBreadcrumbs(true);

    await expect(breadcrumbs[3].CustomData.requestURL).toBe("http://localhost:4567/fixtures/breadcrumbs/automatic.xhr.html");
  });

  it('does not record requests to raygun domains', function() {
    var breadcrumbs = await common.getBreadcrumbs(true);

    var doesNotContainRaygun = _.every(breadcrumbs, function (crumb) {
      return crumb.CustomData.requestURL.indexOf('raygun') === -1
    });

    await expect(doesNotContainRaygun).toBe(true);
  });

  it("does not log bodies when logXhrContents is false", function() {
    var breadcrumbs = await browser.execute(function() {
      window.rg4js('logContentsOfXhrCalls', true);

      return window.rg4js('getRaygunInstance').getBreadcrumbs();
    });

    await expect(breadcrumbs[1].CustomData.body).toContain("Disabled");
  });
});
