var webdriverio = require('webdriverio');
var _ = require('underscore');

var _entriesEndpoint = 'https://api.raygun.io/entries';

describe("Payload functional validation tests for V2 syntax error caught with the Snippet", function() {

  it("performs an XHR to /entries when a syntax error is present", function () {
    await browser.url('http://localhost:4567/fixtures/v2/syntaxErrorSnippet.html');
    
    await browser.pause(6000);

    var requestPayloads = await browser.execute(function () {
      return window.__requestPayloads;
    });

    var doesHaveLineNumbersAndColumnNumbers = await _.any(requestPayloads, function (req) {
      console.log('[stacktrace]');
      var stackTracesToCheck = req.Details.Error.StackTrace.slice(0, 2);
      return _.every(stackTracesToCheck, function(trace) {
        if (trace.MethodName === 'eval') {
          return true;
        }

        return typeof trace.LineNumber === 'number' && typeof trace.ColumnNumber === 'number';
      });
    });

    await expect(doesHaveLineNumbersAndColumnNumbers).toBe(true);
  });

});
