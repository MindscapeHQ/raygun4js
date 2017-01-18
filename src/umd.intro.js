// https://github.com/umdjs/umd/blob/master/templates/returnExportsGlobal.js

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['raygun4js'], function (raygun4js) {
            return (root.Raygun = factory(raygun4js));
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('raygun4js'));
    } else {
        // Browser globals
        root.Raygun = factory(root.raygun4js);
    }
}(this, function (raygun4js) {

  var windw = this;

  // Same approach as the snippet, creates the rg4js proxy function, which is exported in umd.outro.js once the
  // script is executed
  (function(wind) { wind['RaygunObject'] = 'rg4js';
  wind['rg4js'] = wind['rg4js'] || function() {
      (wind['rg4js'].o = wind['rg4js'].o || []).push(arguments)
  }})(windw);