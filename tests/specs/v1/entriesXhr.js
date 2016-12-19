var webdriverio = require('webdriverio');
var _ = require('underscore');

var _entriesEndpoint = 'https://api.raygun.io/entries';

describe("XHR functional tests for /entries with V1", function() {

  // Setup

  beforeAll(function () {

    browser.url('http://localhost:4567/fixtures/v1/manualSend.html');

    browser.execute(function () {
      (function() {
        window.__inFlightXHRs = [];
        window.__completedXHRs = [];

        var origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function() {

          window.__inFlightXHRs.push({
            xhr: this,
            method: arguments[0],
            url: arguments[1]
          });

          this.addEventListener('load', function() {
              window.__completedXHRs.push(this);

              console.log(this.readyState); //will always be 4 (ajax is completed successfully)
              console.log(this.responseText); //whatever the response was
          });

          origOpen.apply(this, arguments);
        };
      })();
    });

  });

  // Tests

  it('performs an XHR to /entries when Raygun.send() is called', function () {
    browser.pause(4000);

    var inFlightXhrs = browser.execute(function () {
      return window.__inFlightXHRs;
    });

    var didPerformRequest = _.any(inFlightXhrs.value, function (req) {
      return req.url.indexOf(_entriesEndpoint) === 0;
    });

    expect(didPerformRequest).toBe(true);
  });
});