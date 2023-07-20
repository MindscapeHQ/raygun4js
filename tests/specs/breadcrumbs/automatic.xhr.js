/* globals describe, beforeEach, it, expect, browser, window */

var _ = require('underscore');
var common = require("../common");

describe("XHR tracking", function() {
  beforeEach(async function() {
    await browser.url("http://localhost:4567/fixtures/breadcrumbs/automatic.xhr.html");
    await browser.pause(2000);
  });

  it("tracks XHR start and end events", async function() {
    var breadcrumbs = await common.getBreadcrumbs(true);

    expect(breadcrumbs[0].type).toBe("request");
    expect(breadcrumbs[0].message).toContain("Opening request");

    expect(breadcrumbs[1].type).toBe("request");
    expect(breadcrumbs[1].message).toContain("Finished request");
  });

  it("works when the responseType is non text", async function() {
    var breadcrumbs = await common.getBreadcrumbs(true);

    expect(breadcrumbs[2].type).toBe("request");
    expect(breadcrumbs[2].message).toContain("Opening request");

    expect(breadcrumbs[4].type).toBe("request");
    expect(breadcrumbs[4].message).toContain("Finished request");
  });

  it("records the correct message with the URL", async function() {
    var breadcrumbs = await common.getBreadcrumbs(true);

    expect(breadcrumbs[0].message).toBe("Opening request to http://localhost:4567/fixtures/breadcrumbs/automatic.console.html");
  });

  it("records the correct requestURL", async function() {
    var breadcrumbs = await common.getBreadcrumbs(true);

    expect(breadcrumbs[0].CustomData.requestURL).toBe("http://localhost:4567/fixtures/breadcrumbs/automatic.console.html");
  });

  it("records the correct requestURL for absolute paths", async function() {
    var breadcrumbs = await common.getBreadcrumbs(true);

    expect(breadcrumbs[3].CustomData.requestURL).toBe("http://localhost:4567/fixtures/breadcrumbs/automatic.xhr.html");
  });

  it('does not record requests to raygun domains', async function() {
    var breadcrumbs = await common.getBreadcrumbs(true);

    var doesNotContainRaygun = _.every(breadcrumbs, function (crumb) {
      return crumb.CustomData.requestURL.indexOf('raygun') === -1
    });

    expect(doesNotContainRaygun).toBe(true);
  });

  it("does not log bodies when logXhrContents is false", async function() {
    var breadcrumbs = await browser.execute(function() {
      window.rg4js('logContentsOfXhrCalls', true);

      return window.rg4js('getRaygunInstance').getBreadcrumbs();
    });

    expect(breadcrumbs[1].CustomData.body).toContain("Disabled");
  });
});
