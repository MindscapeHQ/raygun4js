// https://github.com/umdjs/umd/blob/master/templates/returnExportsGlobal.js

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('raygun4js', function () {
            return (root.Raygun = factory());
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals
        root.Raygun = factory();
    }
}(this, function () {

  var windw = this;

  // Similar approach as the snippet, creates the rg4js proxy function, which is exported in umd.outro.js once the
  // script is executed, and later overwritten by the loader once it's finished
  (function(wind) { wind['RaygunObject'] = 'rg4js';
  wind[wind['RaygunObject']] = wind[wind['RaygunObject']] || function() {
      if (wind && typeof wind['Raygun'] === 'undefined' ||
        (typeof document === 'undefined' || document.readyState !== 'complete')) {
        // onload hasn't been called, cache the commands just like the snippet
        (wind[wind['RaygunObject']].o = wind[wind['RaygunObject']].o || []).push(arguments)
      } else {
        // onload has been called and provider has executed, call the executor proxy function
        wind[wind['RaygunObject']](arguments[0], arguments[1]);
      }
      
  }})(windw);