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