# Raygun4js

[Raygun.com][rayguncom] provider for client-side JavaScript

[rayguncom]: https://raygun.com

## Getting Started

### Asynchronous method - Highly recommended

**Step 1**

No installation via a package manager is required. Just add the following snippet to the beginning of the `<head>` tag within your markup. Please include this snippet before any other `<script>` tag references are made to ensure that Raygun has the best chance to capture all error events on the page.

```javascript
<script type="text/javascript">
    !function(a,b,c,d,e,f,g,h){a.RaygunObject=e,a[e]=a[e]||function(){
    (a[e].o=a[e].o||[]).push(arguments)},f=b.createElement(c),g=b.getElementsByTagName(c)[0],
    f.async=1,f.src=d,g.parentNode.insertBefore(f,g),h=a.onerror,a.onerror=function(b,c,d,f,g){
    h&&h(b,c,d,f,g),g||(g=new Error(b)),a[e].q=a[e].q||[],a[e].q.push({
    e:g})}}(window,document,"script","//cdn.raygun.io/raygun4js/raygun.min.js","rg4js");
</script>
```

The above snippet will fetch the Raygun4JS script from our CDN asynchronously, so it doesn't block other scripts from being loaded. It will also catch errors that are thrown while the page is loading, and send them when the script is ready.


**Note:** If you encounter a situation where no events are appearing within Raygun, you may need to hard code the URL protocol so that the CDN matches your hosting environment. This could look like one of the following -
- `https://cdn.raygun.io/raygun4js/raygun.min.js` 
- `http://cdn.raygun.io/raygun4js/raygun.min.js` 

This will be in replacement of `//cdn.raygun.io/raygun4js/raygun.min.js`.

### Via package manager installation 
For installations and usage via a package manager, refer to the [Synchronous methods](#synchronous-methods) section of this document.

**Step 2**

Add the following lines to your JS site code and paste in your API key (from your Raygun Application Settings), to set up the provider to automatically send errors to your Raygun app:

```javascript
<script type="text/javascript">
    rg4js('apiKey', 'paste_your_api_key_here');
    rg4js('enableCrashReporting', true);
</script>
```

This will configure the provider to send to your Raygun app, and to automatically send all unhandled errors.

That's it for the basic setup! See **Usage** below for more info on how to send errors.

**Snippet without page load error handler**

If you do not want errors to be caught while the page is loading, [use this snippet here][nohandler].

[nohandler]: https://raw.github.com/MindscapeHQ/raygun4js/master/src/snippet/minified.nohandler.js

### Synchronous methods

Note that using these methods will not catch errors thrown while the page is loading. The script needs to be referenced before your other site/app scripts and will block the page load while it is being downloaded/parsed/executed.

This will also disrupt RUM timings, making them erroneous. For RUM, it is especially important that the async snippet method above is used, instead of one of the following.

#### With Bower

Run `bower install raygun4js`

#### With NPM

```javascript
npm install raygun4js --save
```

This lets you require the library with tools such as Webpack or Browserify.

#### From NuGet

Visual Studio users can get it by opening the Package Manager Console and typing `Install-Package raygun4js`

#### React Native/as a UMD module

React Native and other bundled app frameworks that use packaging/module loading libraries can use Raygun4JS as a UMD module:

```
// Install the library

npm install raygun4js --save

// In a central module, reference and install the library

import rg4js from 'raygun4js'; // Import the library with this syntax
var rg4js = require('raygun4js'); // Or this syntax

rg4js('enableCrashReporting', true);
rg4js('apiKey', 'paste_your_api_key_here');
// Any other config options you want such as rg4js('setUser', ...) [see below]
rg4js('boot'); // For React Native only: add this after all other config options have been called
```

All unhandled errors will then be sent to Raygun. You can also `require('raygun4js')` in any other modules and use the rest of the V2 API below - including `rg4js('send', error)` for manual error sending.

If you use this approach, we appreciate your feedback as this is a new feature for the library.

#### Manual download

Download the [production version][min] or the [development version][max]. You can also download a version without
the jQuery hooks if you are not using jQuery or you wish to provide your own hooks. Get this as a
[production version][min.vanilla] or [development version][max.vanilla].

[min]: https://cdn.raygun.io/raygun4js/raygun.min.js
[max]: https://cdn.raygun.io/raygun4js/raygun.js
[min.vanilla]: https://cdn.raygun.io/raygun4js/raygun.vanilla.min.js
[max.vanilla]: https://cdn.raygun.io/raygun4js/raygun.vanilla.js

## Usage

If you are using the CDN, be sure to call these usage methods after the installation.

To send errors manually:

```javascript
try {
  throw new Error('oops');
}
catch(e) {
  rg4js('send', e);
}
```

In order to get stack traces, you need to wrap your code in a try/catch block like above. Otherwise the error hits ```window.onerror``` handler and may only contain the error message, line number, and column number.

You also need to throw errors with ```throw new Error('foo')``` instead of ```throw 'foo'```.

To automatically catch and send unhandled errors, you can attach the automatic window.onerror handler callback:

```javascript
rg4js('enableCrashReporting', true);
```

If you need to detach it (this will disable automatic unhandled error sending):

```javascript
rg4js('detach');
```


## Documentation

### Initialization Options

To configure the provider, call this and pass in an options object:

```javascript
rg4js('options', {
  // Add some or all of the options below
});
```

The second parameter should contain one or more of these keys and a value to customize the behavior:

`ignoreAjaxAbort` - User-aborted Ajax calls result in errors - if this option is true, these will not be sent.

`ignoreAjaxError` - Ajax requests that return error codes will not be sent as errors to Raygun if this options is true.

`debugMode` - Raygun4JS will log to the console when sending errors.

`wrapAsynchronousCallbacks` - if set to `false`, async callback functions triggered by setTimeout/setInterval will not be wrapped when attach() is called. _Defaults to true_

`ignore3rdPartyErrors` - ignores any errors that have no stack trace information. This will discard any errors that occur completely
within 3rd party scripts - if code loaded from the current domain called the 3rd party function, it will have at least one stack line
and will still be sent. Errors that occur in browser extensions or that have been triggered by bots/crawlers that appear to come from
your website will also be ignored. _Note: IE 9 and below have no stacktrace information and errors will be discarded with this enabled._

`excludedHostnames` - Prevents errors from being sent from certain hostnames (domains) by providing an array of strings or RegExp
objects (for partial matches). Each should match the hostname or TLD that you want to exclude. Note that protocols are not tested.

`excludedUserAgents` - Prevents errors from being sent from certain user agents by providing an array of strings. This is very helpful to exclude errors reported by certain browsers or test automation with `CasperJS`, `PhantomJS` or any other testing utility that sends a custom user agent. If a part of the client's `navigator.userAgent` matches one of the given strings in the array, then the client will be excluded from error reporting.

`disableErrorTracking` - Stops all errors from being sent to Raygun. This includes errors automatically picked up by global error handlers as well as errors manually sent.

`disablePulse` - Stops real user monitoring events from being sent.

`apiEndpoint` - A string URI containing the protocol, domain and port (optional) where all payloads will be sent to. This can be used to proxy payloads to the Raygun API through your own server. When not set this defaults internally to the Raygun API, and for most usages you won't need to set this.

`clientIp` - A string containing the client's IP address. RUM requests will be associated to this IP address when set. Particularly useful when proxying payloads to the Raygun API using the `apiEndpoint` option and maintaining RUM's geographic lookup feature.

_Note: navigator.sendBeacon is used to send RUM payloads when a page is unloading. As such the `clientIp` feature will not associate this last payload._

`pulseMaxVirtualPageDuration` - The maximum time a virtual page can be considered viewed, in milliseconds (defaults to 30 minutes).

`pulseIgnoreUrlCasing` - Ignore URL casing when sending data to RUM.

`captureUnhandledRejections` - Automatically catch send errors relating to unhandled promise rejections. See [MDN for browser support](https://developer.mozilla.org/en-US/docs/Web/Events/unhandledrejection).

`setCookieAsSecure` - If the cookies are being used (only used on browsers which don't support localStorage or sessionStorage) then they will be created using the `; secure` flag and thus cookies only work on HTTPS.

`captureMissingRequests` - RUM uses the window.performance API to track XHR timing information and (depending on the browser) not all non-2XX XHR timings are recorded by this API. This option enables the tracking of these missing XHR's calls by tracking the difference between send & success XHR handlers. This is not enabled by default due these timings being as accurate as the performance API.

`automaticPerformanceCustomTimings` - When enabled Raygun4JS will track each `window.performance.measure` call as a custom timing entry. This enables developers to use a more native API for tracking performance timings. More information about `performance.measure` can be found on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure).

`trackCoreWebVitals` - When enabled, Raygun4JS will automatically track and report Core Web Vitals. This is enabled by default.

`trackViewportDimensions` - When enabled, Raygun4JS will send the browser's viewport dimensions with each RUM session payload. This is enabled by default.

An example raygun4js configuration:

```javascript
rg4js('options', {
  ignoreAjaxAbort: true,
  ignoreAjaxError: true,
  debugMode: true,
  ignore3rdPartyErrors: false,
  wrapAsynchronousCallbacks: true,
  excludedHostnames: ['\.local'],
  excludedUserAgents: ['Mosaic'],
  disableErrorTracking: false,
  disablePulse: false,
  pulseMaxVirtualPageDuration: 1800000,
  pulseIgnoreUrlCasing: false,
  captureUnhandledRejections: true,
  setCookieAsSecure: false,
  captureMissingRequests: false,
  automaticPerformanceCustomTimings: false
});
```

### RUM API

#### Tracking Single Page Application (SPA) events

Raygun RUM supports client-side SPAs through the `trackEvent` function:

```javascript
rg4js('trackEvent', {
    type: 'pageView',
    path: '/' + window.location.pathname // Or perhaps window.location.hash
});
```

When a route or view change is triggered in your SPA, this function should be called with type being `pageView` and `path` set to a string representing the new view or route. RUM will collect up all timing information that is available and send it to the dashboard. These are then viewable as 'virtual pages'.

The following are a couple of configuration examples that you can use or adapt for your client-side view library/framework. Naturally, if you are using a more full-featured routing system, you should trigger a pageView inside there when the route changes.

**jQuery**

```javascript
$(window).hashchange(function() {
  rg4js('trackEvent', {
      type: 'pageView',
      path: '/' + location.hash
  });
});
```

**Angular**

```typescript
export class AppModule implements OnInit {
  constructor(private router: Router) {}
  ngOnInit() {
    this.router.events.subscribe(event => {
      // Track page views when the NavigationEnd event occurs
      if (event instanceof NavigationEnd) {
        rg4js('trackEvent', {
          type: 'pageView',
          path: event.url
        });
      }
    });
  }
}
```

#### Tracking custom timings

Custom timings allow you to track custom performance measurements across your website and application. For example, you can track the time it takes for a video to play after the user clicks a button or the time for a component to mount.

```javascript
  rg4js('trackEvent', {
      type: 'customTiming',
      name: 'firstInput',
      duration: 1200,
  });
```
You can read more about custom timings on its [documentation page here](https://raygun.com/documentation/product-guides/real-user-monitoring/for-web/custom-timings/).

#### Legacy custom timings API

_Note: This API has since been deprecated and will be removed in a future version of the provider. We recommend developers upgrade to using the latest version which is both easier to setup and works for single page applications._

```js
rg4js('options', {
  pulseCustomLoadTimeEnabled: true
  // Plus any other configuration options
});

rg4js('trackEvent', {
  type: 'customTimings',
  timings: {
    custom1: 10,
    custom2: 20,
    custom3: 30,
    custom4: 40,
    custom5: 50,
    custom6: 60,
    custom7: 70,
    custom8: 80,
    custom9: 90,
    custom10: 10,
  }
});
```

### Breadcrumbs API

#### Breadcrumbs initialization commands

These should be called if needed during your page's lifecycle:

```javascript
rg4js('one-of-the-below-options')
```

`rg4js('disableAutoBreadcrumbs')` - Disable all the automatic breadcrumb integrations (clicks, requests, console logs and navigation events). This has an inverse `enableAutoBreadcrumbs` which is the default

`rg4js('disableAutoBreadcrumbsConsole')` - Disable just automatic breadcrumb creation from console messages

`rg4js('disableAutoBreadcrumbsNavigation')` - Disable just automatic breadcrumb creation from navigation events

`rg4js('disableAutoBreadcrumbsClicks')` - Disable just automatic breadcrumb creation from element clicks

`rg4js('disableAutoBreadcrumbsXHR')` - Disable just automatic breadcrumb creation XMLHttpRequests

All of the above have an inverse `enableAutoBreadcrumbs<type>` which is the default

`rg4js('setAutoBreadcrumbsXHRIgnoredHosts', [])` - This can be set to an array of hostnames to not create a breadcrumb for requests/responses to. The values inside the array can either be strings that an indexOf check against the host is made, or regexes which is matched against the host.

`rg4js('setBreadcrumbLevel', 'warning')` - Set the minimum level of breadcrumb to record. This works the same as log levels, you may set it to debug, info, warning and error and it will only keep breadcrumbs with a level equal or above what this is set to. Valid values are one of `['debug', 'info', 'warning', 'error']`. Defaults to info.

`rg4js('logContentsOfXhrCalls', true)` - If set to true will include the body contents of XHR request and responses in Breadcrumb metadata, defaults to false

#### Logging a breadcrumb

Breadcrumbs can be manually logged via `rg4js('recordBreadcrumb', ...)`

There are two argument formats

`rg4js('recordBreadcrumb', 'breadcrumb-message', {object: 'that will be attached to the breadcrumb custom data'})`

This is the quickest way to log basic breadcrumbs, requiring only a message and optionally an object to attach some metadata

If you wish to have further control of the breadcrumb and configure the level (debug, info, warning, error) or set the class/method the breadcrumb was logged from

`rg4js('recordBreadcrumb', {message: 'breadcrumb-message', metadata: {goes: 'here'}, level: 'info', location: 'class:method'})`

You may use the above argument format

### Unhandled Promise Rejection

As of 2.10.0 Raygun4JS captures unhandled promise rejections automatically. Browser support for this feature is currently spotty and you can view browser support at [MDN](https://developer.mozilla.org/en-US/docs/Web/Events/unhandledrejection).

To disable this functionality by default you can set the `captureUnhandledRejections` key in the [Initialization Options](Initialization Options).

If you are using a Promise library which contains a global hook for capturing errors you can manually send errors inside of that global hook.

[RSVP.js example:](https://github.com/tildeio/rsvp.js/)
```javascript
RSVP.on('error', function(reason) {
    rg4js('send', {
      error: reason
    });
});
```

Promise libraries which report unhandled rejections to a global `unhandledrejection` DOM event, like [Bluebird](http://bluebirdjs.com/), are automatically picked up when you have `captureUnhandledRejections` set.

### Dynamic code splitting / loading with Webpack

If you are using Webpack to perform dynamic code splitting / loading and you are loading your bundles off of a separate domain (ie a cdn) you will need to ensure that you have set the `output.crossOriginLoading` configuration option to `anonymous` to have Raygun4JS pick up your errors without CORS issues. Without this setting the dynamic script tags will be created without a `crossorigin` attribute and be treated by the browser as private information in Raygun4JS's execution context.

Example Webpack config

```javascript
module.exports = {
  // Other webpack config options
  output: {
    // Other output options
    crossOriginLoading: 'anonymous'
  },
};

```

#### Payload size conservation

To help ensure your payload does not become too large only the most recent 32 breadcrumbs are kept, as well as limiting the size of recorded network request/response texts to 500 characters.

### Multiple Raygun objects on a single page

You can have multiple Raygun objects in global scope. This lets you set them up with different API keys for instance, and allow you to send different errors to more than one application in the Raygun web app.

To create a new Raygun object and use it call:

```javascript
var secondRaygun = rg4js('getRaygunInstance').constructNewRaygun();
secondRaygun.init('apikey');
secondRaygun.send(...);
```

Only one Raygun object can be attached as the window.onerror handler at one time, as *onerror* can only be bound to one function at once. Whichever Raygun object had `attach()` called on it last will handle the unhandle errors for the page. Note that you should use the V1 API to send using the second Raygun object, and it should be created and called once the page is loaded (for instance in an `onload` callback).

### NoConflict mode

If you already have an variable called Raygun attached to `window`, you can prevent the provider from overwriting this by enabling NoConflict mode:

```javascript
rg4js('noConflict', true);
```

To then get an instance of the Raygun object when using V2, call this once the page is loaded:

```javascript
var raygun = rg4js('getRaygunInstance');
```

You can also provide a callback with `'getRaygunInstance'` and it will be called after raygun4js has loaded with the Raygun instance as an argument:

```javascript
rg4js('getRaygunInstance', raygun => {
});
```

### Callback Events

#### onBeforeSend

```javascript
rg4js('onBeforeSend', function (payload) {
  return payload;
});
```

Call this function and pass in a function which takes one parameter (see the example below). This callback function will be called immediately before the payload is sent. The one parameter it gets will be the payload that is about to be sent. Thus from your function you can inspect the payload and decide whether or not to send it.

From the supplied function, you should return either the payload (intact or mutated as per your needs), or `false`.

If your function returns a truthy object, Raygun4JS will attempt to send it as supplied. Thus, you can mutate it as per your needs - preferably only the values if you wish to filter out data that is not taken care of by `filterSensitiveData()`. You can also of course return it as supplied.

If, after inspecting the payload, you wish to discard it and abort the send to Raygun, simply return `false`.

By example:

```javascript
var myBeforeSend = function (payload) {
  console.log(payload); // Modify the payload here if necessary
  return payload; // Return false here to abort the send
}

rg4js('onBeforeSend', myBeforeSend);
```

#### onBeforeSendRUM

```javascript
rg4js('onBeforeSendRUM', function (payload) {
  return payload;
});
```

Call this function and pass in a function which takes one parameter (see the example below). This callback function will be called immediately before any Real User Monitoring events are sent. The one parameter it gets will be the payload that is about to be sent. Thus from your function you can inspect the payload and decide whether or not to send it.

From the supplied function, you should return either the payload (intact or mutated as per your needs), or `false`.

If your function returns a truthy object, Raygun4JS will attempt to send it as supplied. Thus, you can mutate it as per your needs. You can also of course return it as supplied.

If, after inspecting the payload, you wish to discard it and abort the send to Raygun, simply return `false`.

By example:

```javascript
var myBeforeSend = function (payload) {
  console.log(payload); // Modify the payload here if necessary
  return payload; // Return false here to abort the send
}

rg4js('onBeforeSendRUM', myBeforeSend);
```

#### onAfterSend

```javascript
rg4js('onAfterSend', function (xhrResponse) {
  // Inspect the XHR response here
});
```

Call this function and pass in a function which takes one parameter (see the example below). This callback function will be immediately called after the XHR request for a Crash Reporting or RUM event responds successfully, or errors out (its `onerror` was called). You can inspect the one parameter, which is the XHR object containing the HTTP response data.

#### onBeforeXHR

```javascript
rg4js('onBeforeXHR', function (xhr) {
  // Mutate the xhr parameter as per your needs
});
```

Call this function when you want control over the XmlHttpRequest object that is used to send error payloads to the API. Pass in a callback that receives one parameter (which is the XHR object). Your callback will be called after the XHR object is `open`ed, immediately before it is sent.

For instance, you can use this to add custom HTTP headers.

_Note: `navigator.sendBeacon` is used to send RUM payloads when a page is unloading. In these cases the `onBeforeXHR` method will not be executed as there is no XHR to reference and no additional headers can be attached._

### Custom error grouping

You can control custom grouping for error instances by passing in a callback. This will override the automatic grouping and be used to group error instances together. Errors with the same key will be placed within the same error group. The callback's signature should take in the error payload, stackTrace and options and return a string, ideally 64 characters or less. If the callback returns null or or a non-string the error will be grouped using Raygun's server side grouping logic (this can be useful if you only wish to use custom grouping for a subset of your errors).

```javascript
var groupingKeyCallback = function (payload, stackTrace, options) {
  // Inspect the above parameters and return a hash derived from the properties you want

  return payload.Details.Error.Message; // Naive message-based grouping only
};

rg4js('groupingKey', groupingKeyCallback);
```

### Sending custom data

#### On initialization:

Custom data variables (objects, arrays etc) can be added by calling the withCustomData function on the Raygun object:

```javascript
rg4js('withCustomData', { foo: 'bar' });
```

**During a send:**

You can also pass custom data with manual send calls, with an options object. This lets you add variables that are in scope or global when handled in catch blocks. For example:

```javascript
rg4js('send', {
  error: e,
  customData: [{ foo: 'bar' }]
});
```

#### Providing custom data with a callback

To send the state of variables at the time an error occurs, you can pass withCustomData a callback function. This needs to return an object. By example:

```javascript
var desiredNum = 1;

function getMyData() {
 return { num: desiredNum };
}

rg4js('withCustomData', getMyData);
```

`getMyData` will be called when Raygun4JS is about to send an error, which will construct the custom data. This will be merged with any custom data provided on a Raygun.send() call.

### Adding tags

The Raygun dashboard can also display tags for errors. These are arrays of strings or Numbers. This is done similar to the above custom data, like so:

**On initialization:**

```javascript
rg4js('withTags', ['tag1', 'tag2']);
```

#### During a send:

Pass tags in using an options object:

```javascript
rg4js('send', {
  error: e,
  tags: ['tag3'];
});
```

#### Adding tags with a callback function

As above for custom data, `withTags` can now also accept a callback function. This will be called when the provider is about to send, to construct the tags. The function you pass to `withTags` should return an array (ideally of strings/Numbers/Dates).

### Customers

By default Raygun4JS assigns a unique anonymous ID for the current user. This is stored in local storage and will default back to using a cookie if local storage is not supported. You can remove the ID from storage by calling:

```js
rg4js('getRaygunInstance').resetAnonymousUser();
```

#### Disabling anonymous user tracking

```javascript
rg4js('options', { disableAnonymousUserTracking: true });
```

#### Rich user data/user tracking

You can provide additional information about the currently logged in user to Raygun by calling:

```javascript
rg4js('setUser', {
  identifier: 'user_email_address@localhost.local',
  isAnonymous: false,
  email: 'emailaddress@localhost.local',
  firstName: 'Foo',
  fullName: 'Foo Bar',
  uuid: 'BAE62917-ACE8-ab3D-9287-B6A33B8E8C55'
});
```

Only `identifier` or the first parameter is required. This method takes additional parameters that are used when reporting over the affected users. The full method signature of the public function and the options object above is:

```javascript
setUser: function (user, isAnonymous, email, fullName, firstName, uuid)
```

`user|identifier` is the user identifier. This will be used to uniquely identify the user within Raygun. This is the only required parameter, but is only required if you are using [Customers](https://raygun.com/documentation/product-guides/customers/).

`isAnonymous` is a bool indicating whether the user is anonymous or actually has a user account. Even if this is set to true, you should still give the user a unique identifier of some kind.

`email` is the user's email address.

`fullName` is the user's full name.

`firstName` is the user's first or preferred name.

`uuid` is the identifier of the device the app is running on. This could be used to correlate user accounts over multiple machines.

This will be transmitted with each message. A count of unique users will appear on the dashboard in the individual error view. If you provide an email address, the user's Gravatar will be displayed (if they have one). This method is optional; if it is not called, the [Customers](https://raygun.com/documentation/product-guides/customers/) feature is disabled. Note that if the user context changes (such as in an SPA), you should call this method again to update it.

#### Resetting the user

You can now pass in empty strings (or false to `isAnonymous`) to reset the current user for login/logout scenarios.

### Ending a session

To end a user's current session:

```javascript
rg4js('endSession');
```

This will end the session for a user and start a new one. The new session will remain attached to the current user.

### Version filtering

You can set a version for your app by calling:

```javascript
rg4js('setVersion', '1.0.0.0');
```

This will allow you to filter the errors in the dashboard by that version. You can also select only the latest version, to ignore errors that were triggered by ancient versions of your code. The parameter should be a string in the format `x.x.x` if you want to get the version sorting in Raygun to work nicely, where x is a non-negative integer.

### Filtering sensitive data

You can blacklist keys to prevent their values from being sent it the payload by providing an array of key names:

```javascript
rg4js('filterSensitiveData', ['password', 'credit_card']);
```

If any key matches one in the input array, its value will be replaced with `[removed by filter]`.

You can also pass RegExp objects in the array to `filterSensitiveData`, for controllable matching of keys:

```javascript
var creditCardDataRegex = /credit\D*/; // Remove any keys that begin with 'credit'

rg4js('filterSensitiveData', [creditCardDataRegex]);
```

#### Change filter scope

By default this is applied to the UserCustomData object only (legacy behavior). To apply this to any key-value pair, you can change the filtering scope:

```javascript
rg4js('setFilterScope', 'all'); // Filter any key in the payload
rg4js('setFilterScope', 'customData'); // Just filter the custom data (default)
```

### Source maps support

Raygun4JS now features source maps support through the transmission of column numbers for errors, where available. This is confirmed to work in recent version of Chrome, Safari and Opera, and IE 10 and 11. See the [Raygun souce maps documentation][sourcemaps] for more information.

[sourcemaps]: https://raygun.com/documentation/product-guides/crash-reporting/sourcemaps/

### Offline saving

The provider has a feature where if errors are caught when there is no network activity they can be saved (in Local Storage). When an error arrives and connectivity is regained, previously saved errors are then sent. This is useful in environments like WinJS, where a mobile device's internet connection is not constant.

Offline saving is **disabled by default.** To change it:

```javascript
rg4js('saveIfOffline', true);
```

If an error is caught and no network connectivity is available (the Raygun API cannot be reached), or if the request times out after 10s, the error will be saved to LocalStorage. This is confirmed to work on Chrome, Firefox, IE10/11, Opera and WinJS.

Limited support is available for IE 8 and 9 - errors will only be saved if the request times out.

### Errors in scripts on other domains

Browsers have varying behavior for errors that occur in scripts located on domains that are not the origin. Many of these will be listed in Raygun as 'Script Error', or will contain junk stack traces. You can filter out these errors by settings this:

```javascript
rg4js('options', { ignore3rdPartyErrors: true });
```

#### Whitelisting domains

There is also an option to whitelist domains which you **do** want to allow transmission of errors to Raygun, which accepts the domains as an array of strings:

```javascript
rg4js('options', { ignore3rdPartyErrors: true });
rg4js('whitelistCrossOriginDomains', ['code.jquery.com']);
```

This can be used to allow errors from remote sites and CDNs.

The provider will default to attempt to send errors from subdomains - for instance if the page is loaded from foo.com, and a script is loaded from cdn.foo.com, that error will be transmitted on a best-effort basis.

To get full stack traces from cross-origin domains or subdomains, these requirements should be met:

* The remote domain should have `Access-Control-Allow-Origin` set (to include the domain where raygun4js is loaded from).

* For Chrome the `script` tag must also have `crossOrigin="Anonymous"` set.

* Recent versions of Firefox (>= 31) will transmit errors from remote domains will full stack traces if the header is set (`crossOrigin` on script tag not needed).

In Chrome, if the origin script tag and remote domain do not meet these requirements the cross-origin error will not be sent.

Other browsers may send on a best-effort basis (version dependent) if some data is available but potentially without a useful stacktrace. The provider will cancel the send if no data is available.

## Angular

You can extend the Angular error handler to send errors directly to Raygun.

```typescript
// Create a new ErrorHandler and report an issue straight to Raygun
export class RaygunErrorHandler implements ErrorHandler {
  handleError(e: any) {
    rg4js('send', {
      error: e,
    });
  }
}
```

## Vue.js

You can use the Vue.js error handler to send errors directly to Raygun.

For Vue.js 2.x, this can be done by setting a global error handler on the `Vue.config.errorHandler` property.

```typescript
// Vue 2.x example
Vue.config.errorHandler = function(err, vm, info) {
  rg4js('send', {
    error: err,
    customData: [{ info: info }]
  });
};
```

For Vue.js 3.x, the `.config` property is part of the application instance. You will need to create your application instance first before you can assign the errorHandler property.

```typescript
// Vue 3.x example
const app = Vue.createApp({});

app.config.errorHandler = function(err, vm, info) {
  rg4js('send', {
    error: err,
    customData: [{ info: info }]
  });
};

app.mount('#app');
```

## Release History

[View the changelog here](CHANGELOG.md)
