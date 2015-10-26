(function (window, Raygun) {
  if (!window['RaygunObject'] || !window[window['RaygunObject']]) {
    return;
  }

  var snippetOptions = window[window['RaygunObject']].o;

  var apiKey,
    options,
    withCustomData,
    withTags,
    version,
    filterSensitiveData,
    setFilterScope,
    user,
    onBeforeSend,
    saveIfOffline,
    whitelistCrossOriginDomains,
    attach,
    enablePulse;

  for (var i in snippetOptions) {
    var pair = snippetOptions[i];
    if (pair) {
      var key = pair[0];
      var value = pair[1];

      if (key && value) {
        switch (key) {
          case 'apiKey':
            apiKey = value;
            break;
          case 'options':
            options = value;
            break;
          case 'setUser':
            user = value;
            break;
          case 'onBeforeSend':
            onBeforeSend = value;
            break;
          case 'withCustomData':
            withCustomData = value;
            break;
          case 'withTags':
            withTags = value;
            break;
          case 'setVersion':
            version = value;
            break;
          case 'filterSensitiveData':
            filterSensitiveData = value;
            break;
          case 'setFilterScope':
            setFilterScope = value;
            break;
          case 'whitelistCrossOriginDomains':
            whitelistCrossOriginDomains = value;
            break;
          case 'saveIfOffline':
            saveIfOffline = value;
            break;
          case 'attach':
          case 'enableCrashReporting':
            attach = value;
            break;
          case 'enablePulse':
            enablePulse = value;
            break;
        }
      }
    }
  }

  if (withCustomData) {
    Raygun.withCustomData(withCustomData);
  }

  if (withTags) {
    Raygun.withTags(withTags);
  }

  if (version) {
    Raygun.setVersion(version);
  }

  if (filterSensitiveData) {
    Raygun.filterSensitiveData(filterSensitiveData);
  }

  if (setFilterScope) {
    Raygun.setFilterScope(setFilterScope);
  }

  if (user) {
    Raygun.setUser(user.identifier, user.isAnonymous, user.email, user.fullName, user.firstName, user.uuid);
  }

  if (onBeforeSend) {
    Raygun.onBeforeSend(onBeforeSend);
  }

  if (typeof saveIfOffline === 'boolean') {
    Raygun.saveIfOffline(saveIfOffline);
  }

  if (whitelistCrossOriginDomains) {
    Raygun.whitelistCrossOriginDomains(whitelistCrossOriginDomains);
  }

  var onLoadHandler = function () {
    if (apiKey) {
      if (!options) {
        options = {};
      }

      if (enablePulse) {
        options.disablePulse = false;
      }

      options.from = 'onLoad';
      Raygun.init(apiKey, options, null);
    }

    if (attach) {
      Raygun.attach();

      var errorQueue = window[window['RaygunObject']].q;
      for (var j in errorQueue) {
        Raygun.send(errorQueue[j].e, { handler: 'From Raygun4JS snippet global error handler' });
      }
    }
  };

  if (window.addEventListener) {
    window.addEventListener('load', onLoadHandler);
  } else {
    window.attachEvent('onload', onLoadHandler);
  }

})(window, window.Raygun);