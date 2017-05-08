(function() {
  window.__requestPayloads = [];
  window.__inFlightXHRs = [];
  window.__completedXHRs = [];

  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function() {

    window.__inFlightXHRs.push({
      xhr: this,
      orig: origOpen,
      method: arguments[0],
      url: arguments[1]
    });

    this.addEventListener('load', function() {
        window.__completedXHRs.push(this);
    });

    origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function() {
    if (arguments[0]) {
      var json = JSON.parse(arguments[0]);
      if (json && json.foo == undefined)
        window.__requestPayloads.push(json);
    }

    origSend.apply(this, arguments);
  }

  if (window.XDomainRequest) {
    var origXOpen = XDomainRequest.prototype.open;
    var origXSend = XDomainRequest.prototype.send;

    XDomainRequest.prototype.open = function() {

      window.__inFlightXHRs.push({
        xhr: this,
        orig: origXOpen,
        method: arguments[0],
        // XDomainRequest doesn't support https so it gets trimmed off
        // Add it back in to be consistent with other tests
        url: 'https:' + arguments[1]
      });

      this.onload =  function() {
        window.__completedXHRs.push(this);
      };

      origXOpen.apply(this, arguments);
    };

    XDomainRequest.prototype.send = function() {
      window.__requestPayloads.push(JSON.parse(arguments[0]));

      origXSend.apply(this, arguments);
    }
  }
})()
