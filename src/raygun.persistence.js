// Currently only used by the UMD artifact as a polyfill for no cookie support in React Native


var raygunPersistenceFactory = function (window, Raygun) {

  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

  if (!indexedDB) {
    return;
  }

  var dbName = 'raygun4js';
  var schemaVersion = 1;

  var db;

  Raygun._private.indexedDBStorage = {
    openDBConnection: function () {
      var request = indexedDB.open(dbName, schemaVersion);

      request.onerror = function () {
        //console.log('Raygun4js: error making request to indexedDB');
      };

      request.onsuccess = function (evnt) {
        db = evnt.target.result;
      };

      request.onupgradeneeded = function (evnt) {
        var db = evnt.target.result;
        
        var objectStore = db.createObjectStore('metadata', { keyPath: 'key' });

        objectStore.transaction.oncomplete = function (evnt) {
          var metadataObjectStore = db.transaction('metadata', 'readwrite');

          metadataObjectStore.put({ key: key, value: value }); // Put overwrites the existing entry (if any) 
        };
      };
    },

    setWithExpiry: function (key, value, expiry) {
      var transaction = db.transaction('metadata', 'readwrite');
      var metadataObjectStore = transaction.objectStore('metadata');

      metadataObjectStore.add({ key: key, value: value });
    },

    get: function (key) {
      var transaction = db.transaction('metadata', 'readwrite');
      var metadataObjectStore = transaction.objectStore('metadata');
      
      var request = metadataObjectStore.get(key);

      var result;
      request.onsuccess = function (evnt) {
        result = evnt.result; // .value
      }.bind(this);

      var loopCount = 0;

      while (typeof result === 'undefined' && loopCount < 100) {
        loopCount++;
      }

      return result;
    },

    clear: function (key) {

    }
  };

  Raygun._private.indexedDBStorage.openDBConnection();

};

raygunPersistenceFactory(window, window.__instantiatedRaygun);