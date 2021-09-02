/**
 * @prettier
 */

window.raygunViewportFactory = function raygunViewportFactory(window, document, Raygun) {
  'use strict';

  var utils = Raygun.Utilities;
  var nullResult = {
    width: null,
    height: null
  };

  var getViewportWidth = function getViewportWidth() {
    return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  };

  var getViewportHeight = function getViewportHeight() {
    return Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  };

  var isValidDimension = function isValidDimension(dimensionValue) {
    return !utils.isNil(dimensionValue) && !isNaN(dimensionValue) && dimensionValue > 0;
  };

  return {
    getViewportDimensions: function getViewportDimensions() {
      if (utils.isNil(document) || utils.isNil(window)) {
        return nullResult;
      }

      var viewportWidth = getViewportWidth();
      var viewportHeight = getViewportHeight();

      if (!isValidDimension(viewportWidth) && !isValidDimension(viewportHeight)) {
        return nullResult;
      }

      return {
        width: viewportWidth,
        height: viewportHeight,
      };
    }
  };
};
