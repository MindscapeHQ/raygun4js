var webdriverio = require('webdriverio');

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

          this.addEventListener('load', function() {
              window.__completedXHRs.push(this.readyState);

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
    browser.pause(3000);

    var result = browser.execute(function () {
      return window.__completedXHRs.length;
    });

    expect(result.value).toBe(1);
  });
});