(function(wind, doc, scriptTag, url, obj, noConflict, script, firstScriptElement, onErrorHandler, fetchObject) {
    wind['RaygunObject'] = obj;
    wind[obj] = wind[obj] || function() {
        (wind[obj].o = wind[obj].o || []).push(arguments)
    },
    script = doc.createElement(scriptTag),
    firstScriptElement = doc.getElementsByTagName(scriptTag)[0];
    script.async = 1;
    script.src = url;

    wind.__raygunNoConflict = !!noConflict;

    firstScriptElement.parentNode.insertBefore(script, firstScriptElement);

    onErrorHandler = wind.onerror;
    wind.onerror = function (msg, url, line, col, err) {
      if (onErrorHandler) {
        onErrorHandler(msg, url, line, col, err);
      }

      if (!err) {
        err = new Error(msg);
      }

      wind[obj].q = wind[obj].q || [];
      wind[obj].q.push({e: err});
    };

    fetchObject = wind.fetch;

    if(!!fetchObject) {
      wind.__raygunOriginalFetch = fetchObject;
      wind.fetch = function() {
        if(!!wind.__raygunFetchCallback) {
          return wind.__raygunFetchCallback.apply(null, arguments); 
        }

        return fetchObject.apply(null, arguments);
      };
    }

})(window, document, 'script', '//cdn.raygun.io/raygun4js/raygun.min.js', 'rg4js');
