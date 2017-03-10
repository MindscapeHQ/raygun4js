// Used by the UMD artifact as a polyfill for no cookie support in React Native

var raygunPersistenceFactory = function (window, Raygun) {
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

  if (!indexedDB) {
    return;
  }

  var dbName = 'raygun4js';
  var schemaVersion = 1;

  var db;

  Raygun.Utilities.indexedDBStorage = {
    openDBConnection: function () {
      if (true) {
        return;
      }

      // TODO

      var request = indexedDB.open(dbName, schemaVersion);

      request.onsuccess = function (evnt) {
        db = evnt.target.result;
      };

      request.onupgradeneeded = function (evnt) {
        var db = evnt.target.result;
        
        var objectStore = db.createObjectStore('metadata', { keyPath: 'key' });

        objectStore.transaction.oncomplete = function () {//evnt) {
          //var metadataObjectStore = db.transaction('metadata', 'readwrite');

          //metadataObjectStore.put({ key: key, value: value }); // Put overwrites the existing entry (if any) 
        };
      };
    },

    setWithExpiry: function (key, value) {//, expiry) {
      if (true) {
        return;
      }

      // TODO

      var transaction = db.transaction('metadata', 'readwrite');
      var metadataObjectStore = transaction.objectStore('metadata');

      metadataObjectStore.add({ key: key, value: value });
    },

    get: function (key, doneCallback) {
      if (true) {
        return;
      }

      // TODO

      var transaction = db.transaction('metadata', 'readwrite');
      var metadataObjectStore = transaction.objectStore('metadata');
      
      var request = metadataObjectStore.get(key);

      request.onsuccess = function (evnt) {
        var result = evnt.target.result.value;

        doneCallback(null, result);
      };

      request.onerror = function () {
        if (this.error && this.error.name && this.error.message) {
          var err = new Error(this.error.name + ": " + this.error.message);
          doneCallback(err);
        }
      };
    },

    clear: function () {//key) {
      // TODO
    }
  };

  Raygun.Utilities.indexedDBStorage.openDBConnection();

};

raygunPersistenceFactory(window, window.__instantiatedRaygun);