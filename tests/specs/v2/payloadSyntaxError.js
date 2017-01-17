var webdriverio = require('webdriverio');
var _ = require('underscore');

var _entriesEndpoint = 'https://api.raygun.io/entries';

describe("Payload functional validation tests for V2 syntax error caught with the Snippet", function() {

  it("performs an XHR to /entries when a syntax error is present", function () {
    browser.url('http://localhost:4567/fixtures/v2/syntaxErrorSnippet.html');
    
    browser.pause(6000);

    var requestPayloads = browser.execute(function () {
      return window.__requestPayloads;
    });

    var doesHaveLineNumbersAndColumnNumbers = _.any(requestPayloads.value, function (req) {
      return typeof req.Details.Error.StackTrace[0].LineNumber === 'number' &&
        typeof req.Details.Error.StackTrace[0].ColumnNumber === 'number' &&
        typeof req.Details.Error.StackTrace[1].LineNumber === 'number' &&
        typeof req.Details.Error.StackTrace[1].ColumnNumber === 'number'
    });

    expect(doesHaveLineNumbersAndColumnNumbers).toBe(true);
  });

});