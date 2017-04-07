module.exports = {
  isIEVersion: function(version) {
    return browser.desiredCapabilities.browserName === 'internet explorer'
        && browser.desiredCapabilities.version === version;
  },
  isOldIE: function() {
    return this.isIEVersion('8') || this.isIEVersion('9');
  }
};
