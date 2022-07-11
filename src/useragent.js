/*
 * raygun4js
 * https://github.com/MindscapeHQ/raygun4js
 *
 * Copyright (c) 2013-2022 Raygun Limited
 * Licensed under the MIT license.
 */


window.raygunUserAgent = navigator.userAgent;

window.raygunUserAgentData = window.navigator.userAgentData || null;
window.raygunUserAgentDataStatus = 1; // 1: Start, 2: high entropy success, 3: timed-out

//Run this asap so that the High Entropy user agent data will be available, when we send data to the server
(function () {
    setTimeout(function () { if (window.raygunUserAgentDataStatus === 1) { window.raygunUserAgentDataStatus = 3; } }, 200);

    if (!(window && window.navigator && window.navigator.userAgentData)) { return; }

    if (!!window.navigator.userAgentData.getHighEntropyValues) {
        var hints = ["platformVersion", "fullVersionList" /* ,"model"  //We may want model (device) info in the future */];

        window.navigator.userAgentData
            .getHighEntropyValues(hints)
            .then(
                function (highEntropyUserAgentData) {
                    window.raygunUserAgentData = highEntropyUserAgentData;
                    window.raygunUserAgent = getHighFidelityUAString(window.raygunUserAgent);

                    window.raygunUserAgentDataStatus = 2;
                },
                function (e) {
                    window.console.error('Error calling getHighEntropyValues: ', e);
                });
    }

})();


function getHighFidelityUAString(userAgentString) {

    if (!window.raygunUserAgentData) {
        return userAgentString;
    }
    if (window.raygunUserAgentData.platform === "Windows") {
        var platformVersion = (window.raygunUserAgentData.platformVersion || '').split(".");
        var majorVersion = parseInt(platformVersion[0], 10) || 0;
        if (majorVersion >= 13) {
            userAgentString = userAgentString.replace('Windows NT 10.0', 'Windows NT 11.0');
        }
    }
    var fullVersionList = window.raygunUserAgentData.fullVersionList;

    if (!fullVersionList) {
        return userAgentString;
    }

    var regexChrome = /Chrome\/(\d+)\.(\d+)\.(\d+)\.(\d+)/i;
    var regexEdge = /Edg\/(\d+)\.(\d+)\.(\d+)\.(\d+)/i;
    // var regexOpera = /OPR\/(\d+)\.(\d+)\.(\d+)\.(\d+)/i; // Not used below, yet???

    for (var n = 0; n < fullVersionList.length; n++) {

        var version = fullVersionList[n].version;
        var brand = fullVersionList[n].brand;

        if (brand === "Chromium") {
            userAgentString = userAgentString.replace(regexChrome, 'Chrome\/' + version);
        }
        if (brand === "Microsoft Edge") {
            userAgentString = userAgentString.replace(regexEdge, 'Edg\/' + version);
        }
        //Opera (version 88) behaves differently, it correctly populates the UserAgent string; but not the high entropy UserAgentData. This may change in the future?! 
        /* 
        if (brand === "Opera") {                         
           userAgentString = userAgentString.replace(regexOpera, 'OPR\/' + version);
        }
         */
    }

    return userAgentString;
}