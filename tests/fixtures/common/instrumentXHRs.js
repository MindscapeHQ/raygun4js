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
    window.__requestPayloads.push(JSON.parse(arguments[0]));

    origSend.apply(this, arguments);
  }
})()