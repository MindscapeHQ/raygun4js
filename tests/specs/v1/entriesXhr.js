var webdriverio = require('webdriverio');

describe("XHR functional tests for /entries with V1", function() {

  // Setup

  

  beforeAll(function () {
    browser.url('http://localhost:4567/fixtures/v1/manualSend.html');

    browser.execute(function () {
      window.inFlightMonitoredRequests = [];

      var entriesEndpoint = 'https://api.raygun.io/entries';

      

      (function(xhr) {
          function hookOnLoadStart(xhrInstance) {
              debugger;
              
              inFlightMonitoredRequests.push(xhrInstance);
          }

          function hookOnLoad(xhrInstance) {
            //inFlightMonitoredRequests.pop();
          }

          function hookOnError(xhrInstance) {
            //inFlightMonitoredRequests.pop();
          }
          
          var send = xhr.send;
          xhr.send = function(data) {
              var ols = this.onloadstart;
              var ol = this.onload;
              var oe = this.onerror;

              if (ols) {
                  
                  this.onloadstart = function() {
                      //throw new Error('here');
                      hookOnLoadStart(this);
                      return ols.apply(this, arguments);
                  };

                  this.onload = function() {
                    //throw new Error('here2');
                      hookOnLoad(this);
                      return ol.apply(this, arguments);
                  };

                  this.onerror = function() {
                    //throw new Error('here3');
                      hookOnError(this);
                      return oe.apply(this, arguments);
                  };
              }
              return send.apply(this, arguments);
          };
      })(window.XMLHttpRequest.prototype);
    });
  })

  // Tests

  it('performs an XHR to /entries when Raygun.send() is called', function () {
    var result = browser.execute(function () {
      try {
        throw new Error('Manual Send');
      } catch (e) {
        Raygun.send(e);
      }
    }).waitUntil(2000);

    var result = browser.execute(function () {
      return window.inFlightMonitoredRequests.length;
    });

    expect(result.value).toBe(true);
  });
});