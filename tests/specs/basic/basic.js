var webdriverio = require('webdriverio');
/*var options = {
    desiredCapabilities: {
        browserName: 'phantomjs'
    }
};*/

describe("Basic Raygun4JS loading integration tests", function() {

  // Tests

  it('should load raygun4js with the basic config with no errors', function () {
      browser.url('http://localhost:4567/fixtures/basic/index.html');
      var title = browser.getTitle();

      expect(title).toBe('Basic test');
  });
});