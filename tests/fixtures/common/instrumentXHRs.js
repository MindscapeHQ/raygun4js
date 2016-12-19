(function() {
  window.__inFlightXHRs = [];
  window.__completedXHRs = [];

  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {

    window.__inFlightXHRs.push({
      xhr: this,
      method: arguments[0],
      url: arguments[1]
    });

    this.addEventListener('load', function() {
        window.__completedXHRs.push(this);
    });

    origOpen.apply(this, arguments);
  };
})()