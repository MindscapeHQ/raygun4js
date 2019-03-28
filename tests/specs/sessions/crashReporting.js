describe("Crash Reporting Anonymous User Tracking", function() {
  afterEach(function() {
    browser.execute(function() {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  describe("with anonymous user tracking", function() {
    it("creates a user id and persists it in localStorage when one doesn't exist", function() {
      browser.url("http://localhost:4567/fixtures/sessions/crWithoutUser.html");

      var result = browser.execute(function () {
        return localStorage.getItem("raygun4js-userid") !== null;
      }).value;

      expect(result).toBe(true);
    });

    it("retrieves user id from localStorage when one exist", function() {
      browser.execute(function() {
        localStorage.setItem('raygun4js-userid', '1');
      });

      browser.url("http://localhost:4567/fixtures/sessions/crWithoutUser.html");

      var result = browser.execute(function () {
        return localStorage.getItem("raygun4js-userid");
      }).value;

      expect(result).toBe('1');
    });

    it("retrieves user id from a cookie and sets it in localStorage", function() {
      browser.execute(function() {
        var cookieName = 'raygun4js-userid';
        var cookieValue = '1';
        document.cookie = cookieName + '=' + cookieValue + '; path=/';
      });

      browser.url("http://localhost:4567/fixtures/sessions/crWithoutUser.html");

      var localStorageResult = browser.execute(function () {
        return localStorage.getItem("raygun4js-userid");
      }).value;
      expect(localStorageResult).toBe('1');

      var cookieResult = browser.execute(function() {
        function getCookie(name) {
          var nameEQ = name + '=';
          var ca = document.cookie.split(';');
          for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
              c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
              return c.substring(nameEQ.length, c.length);
            }
          }
          return null;
        }

        return getCookie('raygun4js-userid');        
      }).value;
      expect(cookieResult).toBeFalsy();
    });
  });

  describe("with a user set", function() {
    it("doesn't set a user id", function() {
      browser.url("http://localhost:4567/fixtures/sessions/crWithUser.html");

      var result = browser.execute(function () {
        return localStorage.getItem("raygun4js-userid");
      }).value;

      expect(result).toBe(null);
    });
  });
});