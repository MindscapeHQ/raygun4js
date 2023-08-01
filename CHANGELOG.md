# Changelog

All notable changes to this project are documented in this file.

<!---
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
-->

<!--- EXAMPLE 

## [1.1.1] - 2023-03-05

### Added

- Arabic translation (#444).

### Fixed

- Improve French translation (#377).

### Changed

- Upgrade dependencies: Chainsaws 3.2.1, Middleman, etc.

### Removed

- Unused normalize.css file
  

-->

## 2.26.2

### Fixed

- Replaced old company name
- Documentation points to 'new' url

### Changed

- Updated the Raygun url to send events to preferred ingestion endpoint

## v2.26.1 

### Fixed

- Fixed timing bug, where some xhr requests may rarely be mis-attributed to a different page from which they were started on.

### Changed

- Updated unit test libraries and re-enabled running on PR creation

## v2.26.0

- Removed some dead code related to http support in IE8. As IE8 and http is [no longer supported due to security reasons](https://raygun.com/documentation/product-guides/crash-reporting/troubleshooting/#transport-layer-security-tls-compliance)
  
## v2.25.8

- Improve README documentation to be more clear on the protocol relative URL and how to use the CDN implementation without running a server .

## v2.25.7

- Improve README documentation to be more clear on our highly recommended installation steps.
- Minor grammar changes within README
- Add a note about rich user data within README
- Update the Github Workflow to use a support chrome-version for the chromedriver

## v2.25.6

- Improved support for including High Entropy user agent data
  
## v2.25.5

- Adds support for including High Entropy user agent data

## v2.25.4

- Adds support for the Ionic Capacitor cross-platform app runtime

## v2.25.3

- Allows passing a callback with 'getRaygunInstance' to allow for easier access to checking if a raygun instance exists when raygun4js may not have finished loading

## v2.25.2

- Fixes an issue where the rg4js proxy in the umd loader was throwing away the return value of the executor, preventing the use of commands like 'getRaygunInstance'

## v2.25.1

- Fixes an issue where errors on promises, which have been caught, were still being reported to raygun. Thanks @codex- for identifying and fixing the problem.

## v2.25.0

- Attach a parent resource to non-page load events to assist with resource parenting.

## v2.24.0

- Send the browser's viewport width and height with each RUM session payload.

## v2.23.0

- If `ignore3rdPartyErrors` option is true, discard errors that match the pattern of errors from browser extensions, bots and crawlers.

## v2.22.5

- Fixes an issue with Core Web Vital tracking not being able to be disabled.
- Fixes an issue where `navigator.sendBeacon` errors were not being handled gracefully.

## v2.22.4

- Upgrade the web-vitals vendor library to v2.1.0.
- Fixes an issue where Core Web Vital timings were being queued behind virtual page timings.

## v2.22.3

- Fixes an issue where the heartbeat was not clearing the `xhrStatusMap` array due to `this` referring to the window object

## v2.22.2

- Fixes an issue where raygun4js attempts to access the document on non-browser environments. Also ensures that the Core Web Vitals scripts are not initialized for these environments.

## v2.22.1

- Fixes a compatibility issue with the `web-vitals` vendor script and RequireJS.

## v2.22.0

- Adds the ability to track Core Web Vitals when the `trackCoreWebVitals` option is enabled. The option is enabled by default.

## v2.21.1

- Fixes an issue where errors generated on Cordova iOS 6.0+ applications would not contain a stack trace due to the scheme changing from `file` and to `app`

## v2.21.0

- Fixes a memory leak issue by clearing the `xhrStatusMap` array on every heart beat
- Replace the "Script error" message on an unhandled rejection to be "Unhandled promise rejection" to better distinguish between the two

## v2.20.3

- Adds a fallback for calculating the duration for timing entries which have a `.duration` value of zero. This fixes a issue where Safari reports `fetch` calls as having a duration of zero.

## v2.20.2

- Fixes an issue with ionic-cordova errors not reporting due to the stack-trace being null. Thanks @nirajrajbhandari for identifying and fixing the problem

## v2.20.1

- Fixes an issue where some browsers (most notably Mobile Safari) won't send data when the page is being transitioned away from

## v2.20.0

- Adds new custom timings support which enables Custom Timings to work with SPA's and regardless of page loads
- Adds an option `automaticPerformanceCustomTimings` for tracking performance.measure calls as custom timings

## v2.19.1

- Fix accidental removal of node.value

## v2.19.0

- Add manual end session functionality to public API

## v2.18.4

- Fixes an issue where we record the "navigation" entryTypes as cached child assets
- Fixes an issue with `setAutoBreadcrumbsXHRIgnoredHosts` not being applied when requests are opened

## v2.18.3

- Use navigator.sendBeacon when available to send the last request as XHR requests can be cancelled

## v2.18.2

- Fixes an issue with first-paint being calculated incorrectly for Edge/IE browsers

## v2.18.1

- Fixes an issue with how the network tracking util integrates with the fetch snippet

## v2.18.0

- Missing XHR timings are no longer tracked by default. Instead a configuration option exists to enable these via 'captureMissingRequests'
- Set the maximum duration of missing XHR calls to 5 minutes
- Add offset timings to missing XHR calls
- Support for tracking fetch methods which might be referenced locally

## v2.17.2

- Fixes an issue where the XHR data type was not attached to statusCode calls

## v2.17.1

- Fix regression and use localStorage to persist RUM sessions instead of sessionStorage

## v2.17.0

- Add initial support for users to set the client IP address

## v2.16.1

- Fix promise rejection errors when trying to retrieve fetch response text in network-tracking module

## v2.16.0

- Add paint timings to RUM page load metrics using the performance api & msFirstPaint
- Wrap response code get 'text' in a try catch

## v2.15.3

- Change the key for the status code which gets sent to RUM to statusCode to match the API
- Prepend the protocol to the URL in the resolveFullUrl function to accommodate URLs without protocols

## v2.15.2

- Include all dist files in npm package instead of just main file
- Don't run RUM in React Native to prevent a crash, RUM does not support React Native

## v2.15.1

- Fix error in Raygun4JS UMD build with raygunNetworkTrackingFactory being undefined

## v2.15.0

- Use localStorage to persist user id for Crash Reporting instead of a cookie
- Use sessionStorage to persist session id for RUM instead of a cookie
- Start tracking XHR status codes with performance information

## v2.14.1

- Improve support for EmberJS

## v2.14.0

- Add fetch support to automatic XHR breadcrumbs

## v2.13.4

- Fix offline errors not being sent with new API key format

## v2.13.3

- Guard call to XMLHttpRequest.setRequestHeader as it is not present on IE8,9,10,11

## v2.13.2

- Typescript definitions removed, they are now maintained in @types/raygun4js

## v2.13.1

- Set `content-type` header on XHR calls
- Fix issue #302 with the promiseRejectionHandler throwing rejection errors

## v2.13.0

- Unhandled promise exceptions will now use the look for a `reason.error` error instance if `event.reason` isn't already an Error instance.

## v2.12.1

- Bug where stacktraces/messages in older browsers wouldn't be calculated

## v2.12.0

- Add `UnhandledPromiseRejection` tag to errors caught by the unhandled promise callback
- Fixes a bug where the `UnhandledException` tag would be added unnecessarily to subsequent errors
- Manually sending a error which is a string and not a Error object no longer results in a `Script error` being sent. Instead it uses the string as the error message  

## v2.11.1

- Fixes bug with `ignore3rdPartyErrors` that could result in first party errors being ignored
- Fixes Typescript definitions for V2 API

## v2.11.0

- Adds 'setCookieAsSecure' option which will set the '; secure' flag on cookies. Off by default

## v2.10.1

- Fetch calls are now tracked like XHR calls for RUM

## v2.10.0

- Add support for unhandled promise exceptions

## v2.9.4

- Fix crash with stack traces containing undefined urls

## v2.9.2

- Fix potential error attaching breadcrumbs to error payload

## v2.9.1

- Fixes crash in third party error detection code when stacktraces have undefined urls

## v2.9.0

- If logging of XHR contents in Breadcrumbs is enabled requests/responses before the onload event will now be recorded
- Errors that happen before onload event when using Raygun4JS via the NPM module will now be captured

## v2.8.6

- Add a request ID for each page and virtual page to associate it with its child assets
- Add failed posted payload event items to a queue, attempt to send queued items on heartbeat

## v2.8.5

- Navigating to virtual pages before sending custom timings will no longer prevent the page load timings from being sent
- Stop multiple heartbeat timers from being created
- Prevent 'page' and 'virtual page' timings from being included in the same event data item, fixing 'virtual pages' being counted as 'page views'
- Fix child assets being associated with incorrect views
- Fix virtual page duration timings

## v2.8.4

- Correct error in Typescript definition requiring isAnonymous to be a string when setting user information

## v2.8.3

- Fix crash on unhandled exceptions when withTags option is set to a string instead of an array or function returning an array

## v2.8.2

- Fix JSON parsing issue when attempting to use RUM custom timings

## v2.8.1

- Strip query string out of RUM virtual page urls

## v2.8.0

- New onBeforeSendRUM callback to modify and cancel sending of RUM payloads

## v2.7.2

- Disabling automatic breadcrumb functionality will correctly un-enhance the enhanced objects

## v2.7.1

- Don't read response text in breadcrumb XHR logging if logXhrContents is false
- Improve breadcrumb disabling to handle network calls that match xhrIgnoredHosts but were triggered before the xhrIgnoredHosts configuration option was set
- Update TraceKit regexes to handle stacktraces in RN android release builds

## v2.6.7

- Fix a rare initialization issue with RUM and recording events before the provider has finished loading
- Small bugfixes to some of the Breadcrumbs operations

## v2.6.6

- Fixes a runtime bug on init when using the UMD module (installed via NPM) introduced in 2.6.2

## v2.6.5

- React Native: bugfix for 'window is not defined' error upon import

## v2.6.4

- Fix a bug in vanilla and UMD builds introduced when using breadcrumbs

## v2.6.3

- Adds support for tracking custom timings in Real User Monitoring

## v2.6.2

- Fixes corner case bugs with XHRs as recorded by breadcrumbs

## v2.6.1

- Adds breadcrumbs feature

## v2.6.0

- Initial beta support for React Native in Release (production) mode
- Fixed indexOf bug for IE8 compatibility

## v2.5.3

- Fixed offline errors failing to send to Raygun when back online.

## v2.5.2

- Fix for duplicate UnhandledException tags as added in v2.5.0

## v2.5.1

- Loader option setters and errors/trackEvent calls are now executed once onLoad, fixing edge cases and race conditions with `rg4js` calls during various stages of the page lifecycle

## v2.5.0

- Unhandled errors now have a tag added, UnhandledException, for filtering by handled error vs. crash in the Raygun web app
- Update regexes to support stacktraces from Electron, Chrome with Webpack, and many other scenarios/edge cases
- Locally cached errors for offline saving are now keyed off the API key, allowing apps running on different subdomains to use offline caching
- Adds UMD module support for React Native and other non-web bundled app scenarios

## v2.4.3

- Max length of RUM URLs is clamped to 800 chars (aligned with existing backend behavior)
- Guard against an undefined options object causing undefined messages for thrown non-Error objects (strings)

## v2.4.2

- Fix synchronous XHR warnings in Chrome

## v2.4.1

- Fix a bug in v2.4.0 when the library loads first and consumer code sets `rg4js` options which then aren't picked up and used

## v2.4.0

- Allow send/trackEvent calls to be proxied through `rg4js()` to avoid async loading race condition when global Raygun object not available before static load is finished
- Add onAfterSend callback function
- Fix non-RG onerror handlers from being removed if Crash Reporting not enabled

## v2.3.4

- The most recent pending virtual page is now sent when the tab/window is closed from unload (where available)

## v2.3.3

- RUM URLs lowercase by default

## v2.3.2

- Add ability to ignore RUM URL casing

## v2.3.1

- Guard against undefined fetchStart bug in Mobile Safari 8.0 which passed the existing Browser Timing checks

## v2.3.0

- Add new onBeforeXHR function for mutating the XHR object immediately before an error payload is sent to the API
- If invalid non-function handler passed in to jQuery Ajax add function, call the old event handler & return early
- CustomData keys with a value of `null` are now included and not filtered out automatically when filtering is enabled
- Guard against non-string type in message being sub-stringed
- Fix bug when passing callback to `withTags()` and subsequently calling `Raygun.send()` with tags parameter also
- ignoreAjaxAbort now checks for statusCode of `0` in addition to checking if the response headers are null when deciding to ignore a potential aborted Ajax request

## v2.2.3

- Further guards for unsupported `now()` in Safari 7/8

## v2.2.2

- Hotfix for unsupported calls in IE8

## v2.2.1

- Release version of v2.2.0-beta with bug fixes and improvements; trackEvent officially added to API

## v2.2.0-beta

- Adds experimental support for SPA sites to RUM
- noConflict mode improved for V2
- Fixed a bug when attaching onBeforeUnload handler when RUM enabled

- v2.1.1
  - Fix issue where when filterScope set to 'all' resulted in payload 400 errors
  - Guard against null message substring error

## v2.1.0

- Add custom grouping key function
- Add ability to ignore host-names and user agents for RUM
- Calls to `rg4js()` for config setters made after the script has been downloaded by the snippet are now proxied through to the Raygun object, making the V2 API experience like V1
- Guard against data set with V2 API being null for certain out-of-order declaration scenarios
- Fix API rejection issue for large heartbeat payloads
- Fix a bug where the session cookie was not present or invalid

## v2.0.3

- Fixes a snippet loader race condition

- v2.0.2
  - Fixes an issue with isAnonymous from setUser

- v2.0.1
  - Guard against NaNs in RUM timing data

## v2.0.0

- Adds support for Real User Monitoring

## v1.18.7

- Create copy of customData object when filtering

## v1.18.6

- Slice function check for older browsers

## v1.18.5

- Limit active data on JQuery AJAX errors

## v1.18.4

- Error payloads are no longer persisted in localStorage if sending failed due to RG plan hitting its monthly cap
- Guard against invalid JSON being persisted in localStorage on send failure
- Guard against incorrect (non-function) types being passed in as callback handler to wrapped $.event
- Guard against null stacktraces in JS Windows Store apps

## v1.18.3

- Published to npm
- Ajax errors: custom data now includes the markup of the tag which caused the error
- Various improvements to the internal Tracekit fork for Firefox and Chrome
- Added generation of source maps

## v1.18.2

- Safer implementations of _excludedHostnames_ and excludedUserAgents when there are prototype functions on the arrays passed to these keys

## v1.18.1

- filterSensitiveData now also accepts RegExp objects in its param array

## v1.18.0

- Add new `setFilterScope()` function for supporting applying the filterSensitiveData keys across the entire payload (supported scopes are 'all' and 'customData')

## v1.17.0

- Add location.hash to Request.Url before payload is sent

## v1.16.2

- setUser now accepts empty strings/falsey values for logout scenarios
- Max message size of 512 in payload

## v1.16.1

- Guard against a runtime error when no options are specified

## v1.16.0

- Add new ignoreAjaxError option to stop auto sending of Ajax 400/500 errors when attached
- excludedHostnames now takes regexes for partial matching
- Add new excludedUserAgents to prevent sends from certain clients (supports regexes as above)

## v1.15.0

- Support multiple Raygun objects on one page
- jQuery Ajax errors now have better method names (the function signature) for anonymous functions
- Added init option to exclude host-names to prevent sending from certain environments
- wrapAsynchronousCallbacks now defaults to false
- Split the changelog out into this file

## v1.14.0

- Add wrapAsynchronousCallbacks option for disabling wrapping of setTimeout/setInterval callbacks
- Provide query-strings from AngularJS too (hash in URL broke previous logic)
- Fix stacktrace bug from Firefox that caused source maps to not be processed correctly

## v1.13.0

- Added anonymous user tracking, enabled by default
- Errors in third-party scripts (not hosted on origin domain) are now stopped from being sent correctly (flag still must be set true)

## v1.12.0

- Added new `onBeforeSend()` callback function
- `withTags()` can now take a callback function
- Custom data is now filtered by filterSensitiveData (recursively) too
- Guard against 'settings' in ajax errors being undefined, leading to failed sends
- Add support for unique stack trace format in iOS 7 UIWebView for anonymous functions

## v1.11.2

- Guard against another possible undefined string in Tracekit causing an 'indexOf' error

## v1.11.1

- Ajax errors now transmit response text
- Filtered keys are now transmitted with the value sanitized instead of having the whole object removed

## v1.11.0

- Add ignoring 3rd party scripts
- Fix bug with filtering keys on some browsers
- Support chrome extension stack parsing

## v1.10.0

- Added enhanced affected user data to setUser
- Ported latest Tracekit improvements

## v1.9.2

- Fix bug in filter query

## v1.9.1

- Added function to filter sensitive query string

## v1.9.0

- Add ignoreAjaxAbort option
- Provide vanilla build without jQuery hooks

## v1.8.4

- Guard against circular reference in custom data

## v1.8.3

- Allow withCustomData to accept a function to provide a `customdata` object
- Fix undefined URL issue from Ajax
- Rm duplicated Tracekit ajax hook

## v1.8.2

- Fixed bug in Tracekit which caused 'Cannot call method indexOf' of undefined error

## v1.8.1

- Added meaningful message for Ajax errors
- Fixed debugmode logging bug

## v1.8.0

- Add Offline Saving feature; add support for WinJS

## v1.7.2

- Fixed tags not being included when error caught from global window.onerror handler

## v1.7.1

- Fixed broken withTags when no other custom data provided on Send

## v1.7.0

- Added source maps support by transmitting column numbers (from supported browsers)

## v1.6.1

- Fixed an issue with not supplying options to processUnhandledException

## v1.6.0

- Added support for attaching Tags
- Added NuGet package

## v1.5.2

- Added Bower package; minor bugfix for Ajax functionality

## v1.5.1

- Capture data submitted by jQuery AJAX calls

## v1.5.0

- Allow IE8 to submit errors over HTTP
- Updated TraceKit to the latest revision

## v1.4.1

- Fix bug with using jQuery AJAX calls with >= v1.5 of jQuery

## v1.4.0

- AJAX errors will display status code instead of script error

## v1.3.3

- Fixed regression where `send()` would no longer attach a custom data object parameter

## v1.3.2

- Fixed the need to call `attach()` (if only using manual sending)

## v1.3.1

- Added user tracking/Customers and version tracking functionality

## v1.3.0

- Updated to latest TraceKit
- Included removed jQuery support from TraceKit

## v1.2.1

- Added jQuery AJAX error support

## v1.2.0

- Changed from QueryString approach to sending data to using an ajax post with CORS

## v1.0.1

- Initial Release
