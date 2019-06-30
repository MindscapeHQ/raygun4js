(function() {
  window.__requestPayloads = [];
  window.__inFlightXHRs = [];
  window.__completedXHRs = [];
  window.__sentXHRs = [];

  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;
  
  var origSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.setRequestHeader = function() {
    if(!this.__headers) {
      this.__headers = {};
    }
    this.__headers[arguments[0]] = arguments[1];

    origSetRequestHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.getRequestHeader = function() {
    var header = arguments[0];
    return this.__headers[header] || null;
  };

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

    window.__sentXHRs.push({
      xhr: this,
      clientIp: this.getRequestHeader('X-Remote-Address')
    });

    origSend.apply(this, arguments);
  };

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
    };
  }
})()
