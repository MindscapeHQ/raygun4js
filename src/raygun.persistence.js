// Currently only used by the UMD artifact as a polyfill for no cookie support in React Native


var raygunPersistenceFactory = function (window, Raygun) {

  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

  if (!indexedDB) {
    return;
  }

  Raygun._private.indexedDB = {
    setUser: function () {
      var dbName = 'raygun4js';
      var schemaVersion = 1;

      var db;
      
      var request = indexedDB.open(dbName, schemaVersion);

      request.onerror = function () {
        //console.log('Raygun4js: error making request to indexedDB');
      };

      request.onsuccess = function (event) {
        db = event.target.result;
      };

      request.onupgradeneeded = function (event) {
        var db = event.target.result;
        
        var objectStore = db.createObjectStore('users', { keyPath: 'id' });

        objectStore.transaction.oncomplete = function (event) {
          var userObjectStore = db.transaction('users', 'readwrite');
        };
      };
      
    }
  };

};

raygunPersistenceFactory(window, window.__instantiatedRaygun);