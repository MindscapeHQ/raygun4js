var webdriverio = require('webdriverio');
var _ = require('underscore');

describe("Payload functional validation tests for V1 manual send", function() {
  
  it("has the error message in the payload set", function () {
    browser.url('http://localhost:4567/fixtures/v1/manualSend.html');

    browser.pause(4000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads.value, function (payload) {
      return payload.Details.Error.Message === 'Manual send';
    });

    expect(passes).toBe(true);
  });

  it("has the classname in the payload set", function () {
    browser.url('http://localhost:4567/fixtures/v1/manualSend.html');

    browser.pause(4000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var passes = _.any(requestPayloads.value, function (payload) {
      return payload.Details.Error.ClassName === 'Error';
    });

    expect(passes).toBe(true);
  });

  it("has the filename in the stacktrace payload set", function () {
    var pageUrl = 'http://localhost:4567/fixtures/v1/manualSend.html';

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
    var pageUrl = 'http://localhost:4567/fixtures/v1/manualSendTag.html';

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
    var pageUrl = 'http://localhost:4567/fixtures/v1/manualSendCustomData.html';

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
    var pageUrl = 'http://localhost:4567/fixtures/v1/manualSendUser.html';

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

});

