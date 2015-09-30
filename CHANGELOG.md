* v1.18.5
  - Make ActiveTarget an option on JQuery AJAX errors

* v1.18.4
  - Error payloads are no longer persisted in localStorage if sending failed due to RG plan hitting its monthly cap
  - Guard against invalid JSON being persisted in localStorage on send failure
  - Guard against incorrect (non-function) types being passed in as callback handler to wrapped $.event
  - Guard aginst null stacktraces in JS Windows Store apps

* v1.18.3
  - Published to npm
  - Ajax errors: custom data now includes the markup of the tag which caused the error
  - Various improvements to the internal Tracekit fork for Firefox and Chrome
  - Added generation of source maps

* v1.18.2
  - Safer implementations of _excludedHostnames and _excludedUserAgents when there are prototype functions on the arrays passed to these keys

* v1.18.1
  - filterSensitiveData now also accepts RegExp objects in its param array

* v1.18.0
  - Add new setFilterScope() function for supporting applying the filterSensitiveData keys across the entire payload (supported scopes are 'all' and 'customData')

* v1.17.0
  - Add location.hash to Request.Url before payload is sent

* v1.16.2
  - setUser now accepts empty strings/falsey values for logout scenarios
  - Max message size of 512 in payload

* v1.16.1
  - Guard against a runtime error when no options are specified

* v1.16.0
  - Add new ignoreAjaxError option to stop auto sending of Ajax 400/500 errors when attached
  - excludedHostnames now takes regexes for partial matching
  - Add new excludedUserAgents to prevent sends from certain clients (supports regexes as above)

* v1.15.0
  - Support multiple Raygun objects on one page
  - jQuery Ajax errors now have better method names (the function signature) for anonymous functions
  - Added init option to exclude hostnames to prevent sending from certain environments
  - wrapAsynchronousCallbacks now defaults to false
  - Split the changelog out into this file

* v1.14.0
  - Add wrapAsynchronousCallbacks option for disabling wrapping of setTimeout/setInterval callbacks
  - Provide querystrings from AngularJS too (hash in URL broke previous logic)
  - Fix stacktrace bug from Firefox that caused source maps to not be processed correctly

* v1.13.0
  - Added anonymous user tracking, enabled by default
  - Errors in third-party scripts (not hosted on origin domain) are now stopped from being sent correctly (flag still must be set true)

* v1.12.0
  - Added new onBeforeSend() callback function
  - withTags() can now take a callback function
  - Custom data is now filtered by filterSensitiveData (recursively) too
  - Guard against 'settings' in ajax errors being undefined, leading to failed sends
  - Add support for unique stack trace format in iOS 7 UIWebView for anonymous functions

* v1.11.2
  - Guard against another possible undefined string in Tracekit causing an 'indexOf' error

* v1.11.1
  - Ajax errors now transmit response text
  - Filtered keys are now transmitted with the value sanitized instead of having the whole object removed

* v1.11.0
  - Add ignoring 3rd party scripts
  - Fix bug with filtering keys on some browsers
  - Support chrome extension stack parsing

* v1.10.0
  - Added enhanced affected user data to setUser
  - Ported latest Tracekit improvements

* v1.9.2
  - Fix bug in filter query

* v1.9.1
  - Added function to filter sensitive query string

* v1.9.0
  - Add ignoreAjaxAbort option
  - Provide vanilla build without jQuery hooks

* v1.8.4
  - Guard against circular reference in custom data

* v1.8.3
  - Allow withCustomData to accept a function to provide a customdata object
  - Fix undefined URL issue from Ajax
  - Rm duplicated Tracekit ajax hook

* v1.8.2
  - Fixed bug in Tracekit which caused 'Cannot call method indexOf' of undefined error

* v1.8.1
  - Added meaningful message for Ajax errors
  - Fixed debugmode logging bug

* v1.8.0
  - Add Offline Saving feature; add support for WinJS

* v1.7.2
  - Fixed tags not being included when error caught from global window.onerror handler

* v1.7.1
  - Fixed broken withTags when no other custom data provided on Send

* v1.7.0
  - Added source maps support by transmitting column numbers (from supported browsers)

* v1.6.1
  - Fixed an issue with not supplying options to processUnhandledException

* v1.6.0
  - Added support for attaching Tags
  - Added NuGet package

* v1.5.2
  - Added Bower package; minor bugfix for Ajax functionality

* v1.5.1
  - Capture data submitted by jQuery AJAX calls

* v1.5.0
  - Allow IE8 to submit errors over HTTP
  - Updated TraceKit to the latest revision

* v1.4.1
  - Fix bug with using jQuery AJAX calls with >= v1.5 of jQuery

* v1.4.0
  - AJAX errors will display status code instead of script error

* v1.3.3
  - Fixed regression where send()) would no longer attach a custom data object parameter

* v1.3.2
  - Fixed the need to call attach() (if only using manual sending)

* v1.3.1
  - Added user tracking and version tracking functionality

* v1.3.0
  - Updated to latest TraceKit
  - Included removed jQuery support from TraceKit

* v1.2.1
  - Added jQuery AJAX error support

* v1.2.0
  - Changed from QueryString approach to sending data to using an ajax post with CORS

* v1.0.1
  - Initial Release