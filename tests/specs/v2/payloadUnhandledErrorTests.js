var webdriverio = require('webdriverio');
var _ = require('underscore');
var common = require('../common');

var _entriesEndpoint = 'https://api.raygun.io/entries';

describe("Payload functional validation tests for v2 automatic unhandled error sending", function() {

  it("performs an XHR to /entries when rg4js('send') is called", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/unhandledError.html');

    await browser.pause(4000);

    var inFlightXhrs = await browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = _.any(inFlightXhrs, function (req) {
      return req.url.indexOf(_entriesEndpoint) === 0;
    });

    expect(didPerformRequest).toBe(true);
  });

  it("performs an XHR to /entries when rg4js('send') is called when using the UMD build", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/unhandledErrorWithUmdBuild.html');

    await browser.pause(4000);

    var inFlightXhrs = await browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = _.any(inFlightXhrs, function (req) {
      return req.url.indexOf(_entriesEndpoint) === 0;
    });

    expect(didPerformRequest).toBe(true);
  });

  it("doesn't performs an XHR to /entries when the API key isn't set", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/unhandledErrorNoApiKey.html');

    await browser.pause(4000);

    var inFlightXhrs = await browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = _.any(inFlightXhrs, function (req) {
      return req.url.indexOf(_entriesEndpoint) === 0;
    });

    expect(didPerformRequest).toBe(false);
  });

  it("doesn't performs an XHR to /entries when enableCrashReporting isn't set", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/unhandledErrorNoAttach.html');

    await browser.pause(4000);

    var inFlightXhrs = await browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = _.any(inFlightXhrs, function (req) {
      return req.url.indexOf(_entriesEndpoint) === 0;
    });

    expect(didPerformRequest).toBe(false);
  });
  
  
  it("has the error message in the payload set", async function () {
    await browser.url('http://localhost:4567/fixtures/v2/unhandledError.html');

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads, function (payload) {
      return payload.Details.Error.Message.indexOf('Unhandled error') > -1;
    });

    expect(passes).toBe(true);
  });

  it("has the filename in the stacktrace payload set", async function () {
    var pageUrl = 'http://localhost:4567/fixtures/v2/unhandledError.html';

    await browser.url(pageUrl);

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads, function (payload) {
      return payload.Details.Error.StackTrace[0].FileName === pageUrl;
    });

    expect(passes).toBe(true);
  });

  it("has tags in the payload when tags are passed in", async function () {
    var pageUrl = 'http://localhost:4567/fixtures/v2/unhandledErrorTag.html';

    await browser.url(pageUrl);

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads, function (payload) {
      return payload.Details.Tags[0] === 'my_tag';
    });

    expect(passes).toBe(true);
  });

  it("has custom data in the payload when custom data is passed in", async function () {
    var pageUrl = 'http://localhost:4567/fixtures/v2/unhandledErrorCustomData.html';

    await browser.url(pageUrl);

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads, function (payload) {
      return payload.Details.UserCustomData.myCustomKey === 'myCustomValue';
    });

    expect(passes).toBe(true);
  });

  it("has correct user payload when rg4js('setUser') is called", async function () {
    var pageUrl = 'http://localhost:4567/fixtures/v2/unhandledErrorUser.html';

    await browser.url(pageUrl);

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads, function (payload) {
      return payload.Details.User.Identifier === 'user_email_address@localhost.local' &&
        payload.Details.User.IsAnonymous === false &&
        payload.Details.User.FirstName === 'Foo' &&
        payload.Details.User.FullName === 'Foo Bar' &&
        payload.Details.User.UUID === 'BAE62917-ACE8-ab3D-9287-B6A33B8E8C55';
    });

    expect(passes).toBe(true);
  });

  it("has correct version in payload when rg4js('setVersion') is called", async function () {
    var pageUrl = 'http://localhost:4567/fixtures/v2/unhandledErrorVersion.html';

    await browser.url(pageUrl);

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads, function (payload) {
      return payload.Details.Version === '1.0.0.0';
    });

    expect(passes).toBe(true);
  });

  it("has a UnhandleException tag for crash vs. error support", async function () {
    var pageUrl = 'http://localhost:4567/fixtures/v2/unhandledError.html';

    await browser.url(pageUrl);

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads, function (payload) {
      return _.any(payload.Details.Tags, function (tag) {
        return tag === 'UnhandledException';
      });
    });

    expect(passes).toBe(true);
  });

  it("has existing tags and an UnhandleException tag for crash vs. error support", async function () {
    var pageUrl = 'http://localhost:4567/fixtures/v2/unhandledErrorTag.html';

    await browser.url(pageUrl);

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads, function (payload) {
      return _.any(payload.Details.Tags, function (tag) {
        return tag === 'UnhandledException';
      });
    });

    expect(passes).toBe(true);
  });

  it("has existing tags and an UnhandleException tag for crash vs. error support when using a function for withTags", async function () {
    var pageUrl = 'http://localhost:4567/fixtures/v2/unhandledErrorTagWithString.html';

    await browser.url(pageUrl);

    await browser.pause(4000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads, function (payload) {
      return _.any(payload.Details.Tags, function (tag) {
        return tag === 'UnhandledException';
      });
    });

    expect(passes).toBe(true);
  });

});
