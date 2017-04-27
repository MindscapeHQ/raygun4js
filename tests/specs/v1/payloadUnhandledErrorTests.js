var webdriverio = require('webdriverio');
var _ = require('underscore');

var _entriesEndpoint = 'https://api.raygun.io/entries';

describe("Payload functional validation tests for V1 automatic unhandled error sending", function() {

  it("performs an XHR to /entries when Raygun.send() is called", function () {
    browser.url('http://localhost:4567/fixtures/v1/unhandledError.html');

    browser.pause(6000);

    var inFlightXhrs = browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = _.any(inFlightXhrs.value, function (req) {
      return req.url.indexOf(_entriesEndpoint) === 0;
    });

    expect(didPerformRequest).toBe(true);
  });

  it("doesn't performs an XHR to /entries when the API key isn't set", function () {
    browser.url('http://localhost:4567/fixtures/v1/unhandledErrorNoApiKey.html');

    browser.pause(4000);

    var inFlightXhrs = browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = _.any(inFlightXhrs.value, function (req) {
      return req.url.indexOf(_entriesEndpoint) === 0;
    });

    expect(didPerformRequest).toBe(false);
  });

  it("doesn't performs an XHR to /entries when attach() isn't called", function () {
    browser.url('http://localhost:4567/fixtures/v1/unhandledErrorNoAttach.html');

    browser.pause(4000);

    var inFlightXhrs = browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = _.any(inFlightXhrs.value, function (req) {
      return req.url.indexOf(_entriesEndpoint) === 0;
    });

    expect(didPerformRequest).toBe(false);
  });
  
  
  it("has the error message in the payload set", function () {
    browser.url('http://localhost:4567/fixtures/v1/unhandledError.html');

    browser.pause(4000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads.value, function (payload) {
      return payload.Details.Error.Message.indexOf('Unhandled error') > -1;
    });

    expect(passes).toBe(true);
  });

  it("has the filename in the stacktrace payload set", function () {
    var pageUrl = 'http://localhost:4567/fixtures/v1/unhandledError.html';

    browser.url(pageUrl);

    browser.pause(4000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads.value, function (payload) {
      return payload.Details.Error.StackTrace[0].FileName === pageUrl;
    });

    expect(passes).toBe(true);
  });

  it("has tags in the payload when tags are passed in", function () {
    var pageUrl = 'http://localhost:4567/fixtures/v1/unhandledErrorTag.html';

    browser.url(pageUrl);

    browser.pause(4000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads.value, function (payload) {
      return payload.Details.Tags[0] === 'my_tag';
    });

    expect(passes).toBe(true);
  });

  it("has custom data in the payload when custom data is passed in", function () {
    var pageUrl = 'http://localhost:4567/fixtures/v1/unhandledErrorCustomData.html';

    browser.url(pageUrl);

    browser.pause(4000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads.value, function (payload) {
      return payload.Details.UserCustomData.myCustomKey === 'myCustomValue';
    });

    expect(passes).toBe(true);
  });

  it("has correct user payload when Raygun.setUser() is called", function () {
    var pageUrl = 'http://localhost:4567/fixtures/v1/unhandledErrorUser.html';

    browser.url(pageUrl);

    browser.pause(4000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads.value, function (payload) {
      return payload.Details.User.Identifier === 'user_email_address@localhost.local' &&
        payload.Details.User.IsAnonymous === false &&
        payload.Details.User.FirstName === 'Foo' &&
        payload.Details.User.FullName === 'Foo Bar' &&
        payload.Details.User.UUID === 'BAE62917-ACE8-ab3D-9287-B6A33B8E8C55'
    });

    expect(passes).toBe(true);
  });

  it("has correct version in payload when Raygun.setVersion() is called", function () {
    var pageUrl = 'http://localhost:4567/fixtures/v1/unhandledErrorVersion.html';

    browser.url(pageUrl);

    browser.pause(6000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads.value, function (payload) {
      return payload.Details.Version === '1.0.0.0';
    });

    expect(passes).toBe(true);
  });

  it("has a UnhandleException tag for crash vs. error support", function () {
    var pageUrl = 'http://localhost:4567/fixtures/v1/unhandledError.html';

    browser.url(pageUrl);

    browser.pause(4000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads.value, function (payload) {
      return _.any(payload.Details.Tags, function (tag) {
        return tag === 'UnhandledException';
      });
    });

    expect(passes).toBe(true);
  });

  it("has existing tags and an UnhandleException tag for crash vs. error support", function () {
    var pageUrl = 'http://localhost:4567/fixtures/v1/unhandledErrorTag.html';

    browser.url(pageUrl);

    browser.pause(4000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads.value, function (payload) {
      return _.any(payload.Details.Tags, function (tag) {
        return tag === 'UnhandledException';
      });
    });

    expect(passes).toBe(true);
  });

});

