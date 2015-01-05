# Raygun4js

Raygun.io plugin for JavaScript

## Getting Started

### With Bower

Run `bower install raygun4js`

### CDN

Raygun4JS is now available from our content delivery network:

```html
<script type="text/javascript" src="http://cdn.raygun.io/raygun4js/raygun.min.js"></script>
```

You can reference any of the scripts below. The scripts in the /raygun4js/ directory will always be the latest release, and specific releases are available undern /raygun4js/1.x.x/.

### From NuGet

Visual Studio users can get it by opening the Package Manager Console and typing `Install-Package raygun4js`

### Manual download

Download the [production version][min] or the [development version][max]. You can also download a version without
the jQuery hooks if you are not using jQuery or you wish to provide your own hooks. Get this as a
[production version][min.vanilla] or [development version][max.vanilla].

[min]: https://raw.github.com/MindscapeHQ/raygun4js/master/dist/raygun.min.js
[max]: https://raw.github.com/MindscapeHQ/raygun4js/master/dist/raygun.js
[min.vanilla]: https://raw.github.com/MindscapeHQ/raygun4js/master/dist/raygun.vanilla.min.js
[max.vanilla]: https://raw.github.com/MindscapeHQ/raygun4js/master/dist/raygun.vanilla.js

## Usage

In your web page:

```html
<script src="dist/raygun.min.js"></script>
<script>
  Raygun.init('yourApiKey');
</script>
```

To submit manual errors:

```javascript
Raygun.init('yourApiKey');
try {
  // your code
  throw new Error('oops');
}
catch(e) {
  Raygun.send(e);
}
```

In order to get stack traces, you need to wrap your code in a try/catch block like above. Otherwise the error hits ```window.onerror``` handler and will only contain the error message, line number, and column number.

You also need to throw errors with ```throw new Error('foo')``` instead of ```throw 'foo'```.

To automatically catch and send unhandled errors, attach the window.onerror handler call:

```html
<script src="dist/raygun.min.js"></script>
<script>
  Raygun.init('yourApiKey').attach();
</script>
```

If you need to detach it (this will disable automatic unhandled error sending):

```javascript
Raygun.detach();
```

If you are serving your site over HTTP and want IE8 to be able to submit JavaScript errors then you will
need to set the following setting which will allow IE8 to submit the error over HTTP. Otherwise the provider
will only submit over HTTPS which IE8 will not allow while being served over HTTP.

```javascript
Raygun.init('yourApiKey', { allowInsecureSubmissions: true });
```

## Documentation

### Initialization Options

Pass in an object as the second parameter to init() containing one or more of these keys and a boolean to customize the behavior:

`allowInsecureSubmissions` - posts error payloads over HTTP. This allows **IE8** to send JS errors

`ignoreAjaxAbort` - User-aborted Ajax calls result in errors - if this option is true, these will not be sent.

`debugMode` - Raygun4JS will log to the console when sending errors.

`wrapAsynchronousCallbacks` - if set to `false`, async callback functions triggered by setTimeout/setInterval will not be wrapped when attach() is called. _Defaults to true_

`ignore3rdPartyErrors` - ignores any errors that have no stack trace information. This will discard any errors that occur completely
within 3rd party scripts - if code loaded from the current domain called the 3rd party function, it will have at least one stack line
and will still be sent.

An example:

```javascript
Raygun.init('apikey', {
  allowInsecureSubmissions: true,
  ignoreAjaxAbort: true,
  debugMode: true,
  ignore3rdPartyErrors: false
}).attach();
```

### Callback Events

#### onBeforeSend

Call `Raygun.onBeforeSend()`, passing in a function which takes one parameter (see the example below). This callback function will be called immediately before the payload is sent. The one parameter it gets will be the payload that is about to be sent. Thus from your function you can inspect the payload and decide whether or not to send it.

From the supplied function, you should return either the payload (intact or mutated as per your needs), or `false`.

If your function returns a truthy object, Raygun4JS will attempt to send it as supplied. Thus, you can mutate it as per your needs - preferably only the values if you wish to filter out data that is not taken care of by `filterSensitiveData()`. You can also of course return it as supplied.

If, after inspecting the payload, you wish to discard it and abort the send to Raygun, simply return `false`.

By example:

```javascript
var myBeforeSend = function (payload) {
  console.log(payload); // Modify the payload here if necessary
  return payload; // Return false here to abort the send
}

Raygun.onBeforeSend(myBeforeSend);
```

### Sending custom data

**On initialization:**

Custom data variables (objects, arrays etc) can be added by calling the withCustomData function on the Raygun object:

```javascript
Raygun.init('{{your_api_key}}').attach().withCustomData({ foo: 'bar' });
```

They can also be passed in as the third parameter in the init() call, for instance:

```javascript
Raygun.init('{{your_api_key}}', null, { enviroment: 'production' }).attach();
```

**During a Send:**

You can also pass custom data with manual send calls, with the second parameter. This lets you add variables that are in scope or global when handled in catch blocks. For example:

```javascript
Raygun.send(err, [{customName: 'customData'}];
```

#### Providing custom data with a callback

To send the state of variables at the time an error occurs, you can pass withCustomData a callback function. This needs to return an object. By example:

```javascript
var desiredNum = 1;

function getMyData() {
 return { num: desiredNum };
}

Raygun.init('apikey').attach().withCustomData(getMyData);
```

`getMyData` will be called when Raygun4JS is about to send an error, which will construct the custom data. This will be merged with any custom data provided on a Raygun.send() call.

### Adding tags

The Raygun dashboard can also display tags for errors. These are arrays of strings or Numbers. This is done similar to the above custom data, like so:

**On initialization:**

```javascript
Raygun.init('{{your_api_key}}').attach().withTags(['tag1', 'tag2']);
```

**During a Send:**

Pass tags in as the third parameter:

```javascript
Raygun.send(err, null, ['tag']];
```

#### Adding tags with a callback function

As above for custom data, withTags() can now also accept a callback function. This will be called when the provider is about to send, to construct the tags. The function you pass to withTags() should return an array (ideally of strings/Numbers/Dates).

### Unique user tracking

By default, Raygun4JS assigns a unique anonymous ID for the current user. This is stored as a cookie. If the current user changes, to reset it and assign a new ID you can call:

```js
Raygun.resetAnonymousUser();
```

To disable anonymous user tracking, call `Raygun.init('apikey', { disableAnonymousUserTracking: true });`.

#### Rich user data

You can provide additional information about the currently logged in user to Raygun by calling:

```javascript
Raygun.setUser('unique_user_identifier');
```

This method takes additional parameters that are used when reporting over the affected users. the full method signature is

```javascript
setUser: function (user, isAnonymous, email, fullName, firstName, uuid)
```

`user` is the user identifier. This will be used to uniquely identify the user within Raygun. This is the only required parameter, but is only required if you are using user tracking.

`isAnonymous` is a bool indicating whether the user is anonymous or actually has a user account. Even if this is set to true, you should still give the user a unique identifier of some kind.

`email` is the user's email address.

`fullName` is the user's full name.

`firstName` is the user's first or preferred name.

`uuid` is the identifier of the device the app is running on. This could be used to correlate user accounts over multiple machines.

This will be transmitted with each message. A count of unique users will appear on the dashboard in the individual error view. If you provide an email address, the user's Gravatar will be displayed (if they have one). This method is optional; if it is not called no user tracking will be performed. Note that if the user context changes (such as in an SPA), you should call this method again to update it.

### Version filtering

You can set a version for your app by calling:

```
Raygun.setVersion('1.0.0.0');
```

This will allow you to filter the errors in the dashboard by that version. You can also select only the latest version, to ignore errors that were triggered by ancient versions of your code. The parameter needs to be a string in the format x.x.x.x, where x is a positive integer.

### Filter sensitive request data

The library automatically transmits query string key-values. To filter sensitive keys from this, call:

```javascript
Raygun.filterSensitiveData(['pwd']);
```

It accepts an array of strings. If a key in the query string matches any in this array, it won't be sent.

### Source maps support

Raygun4JS now features source maps support through the transmission of column numbers for errors, where available. This is confirmed to work in recent version of Chrome, Safari and Opera, and IE 10 and 11. See the Raygun dashboard or documentation for more information.

### Offline saving

The provider has a feature where if errors are caught when there is no network activity they can be saved (in Local Storage). When an error arrives and connectivity is regained, previously saved errors are then sent. This is useful in environments like WinJS, where a mobile device's internet connection is not constant.

### Errors in scripts on other domains

Browsers have varying behavior for errors that occur in scripts located on domains that are not the origin. Many of these will be listed in Raygun as 'Script Error', or will contain junk stack traces. You can filter out these errors by settings this:

```javascript
Raygun.init('apikey', { ignore3rdPartyErrors: true });
```

There is also an option to whitelist domains which you **do** want to allow transmission of errors to Raygun, which accepts the domains as an array of strings:

```javascript
Raygun.init('apikey', { ignore3rdPartyErrors: true }).whitelistCrossOriginDomains(["jquery.com"]);
```

This can be used to allow errors from remote sites and CDNs.

The provider will default to attempt to send errors from subdomains - for instance if the page is loaded from foo.com, and a script is loaded from cdn.foo.com, that error will be transmitted on a best-effort basis.

To get full stack traces from cross-origin domains or subdomains, these requirements should be met:

* The remote domain should have `Access-Control-Allow-Origin` set (to include the domain where raygun4js is loaded from).

* For Chrome the `script` tag must also have `crossOrigin="Anonymous"` set.

* Recent versions of Firefox (>= 31) will transmit errors from remote domains will full stack traces if the header is set (`crossOrigin` on script tag not needed).

In Chrome, if the origin script tag and remote domain do not meet these requirements the cross-origin error will not be sent.

Other browsers may send on a best-effort basis (version dependent) if some data is available but potentially without a useful stacktrace. The provider will cancel the send if no data is available.

#### Options

Offline saving is **disabled by default.** To get or set this option, call the following after your init() call:

```javascript
Raygun.saveIfOffline(boolean)
```

If an error is caught and no network connectivity is available (the Raygun API cannot be reached), or if the request times out after 10s, the error will be saved to LocalStorage. This is confirmed to work on Chrome, Firefox, IE10/11, Opera and WinJS.

Limited support is available for IE 8 and 9 - errors will only be saved if the request times out.

## Release History

- 1.14.0 - Add wrapAsynchronousCallbacks option for disabling wrapping of setTimeout/setInterval callbacks
- 1.13.1 - Provide querystrings from AngularJS too (hash in URL broke previous logic); fix stacktrace bug from Firefox that caused source maps to not be processed correctly
- 1.13.0 - Added anonymous user tracking, enabled by default
         - Errors in third-party scripts (not hosted on origin domain) are now stopped from being sent correctly (flag still must be set true)
- 1.12.0 - Added new onBeforeSend() callback function
         - withTags() can now take a callback function
         - Custom data is now filtered by filterSensitiveData (recursively) too
         - Guard against 'settings' in ajax errors being undefined, leading to failed sends
         - Add support for unique stack trace format in iOS 7 UIWebView for anonymous functions
- 1.11.2 - Guard against another possible undefined string in Tracekit causing an 'indexOf' error
- 1.11.1 - Ajax errors now transmit response text; filtered keys are now transmitted with the value sanitized instead of having the whole object removed
- 1.11.0 - Add ignoring 3rd party scripts, fix bug with filtering keys on some browsers, support chrome extension stack parsing
- 1.10.0 - Added enhanced affected user data to setUser; ported latest Tracekit improvements
- 1.9.2 - Fix bug in filter query
- 1.9.1 - Added function to filter sensitive query string
- 1.9.0 - Add ignoreAjaxAbort option; provide vanilla build without jQuery hooks
- 1.8.4 - Guard against circular reference in custom data
- 1.8.3 - Allow withCustomData to accept a function to provide a customdata object; fix undefined URL issue from Ajax; rm duplicated Tracekit ajax hook
- 1.8.2 - Fixed bug in Tracekit which caused 'Cannot call method indexOf' of undefined error
- 1.8.1 - Added meaningful message for Ajax errors, fixed debugmode logging bug
- 1.8.0 - Add Offline Saving feature; add support for WinJS
- 1.7.2 - Fixed tags not being included when error caught from global window.onerror handler
- 1.7.1 - Fixed broken withTags when no other custom data provided on Send
- 1.7.0 - Added source maps support by transmitting column numbers (from supported browsers)
- 1.6.1 - Fixed an issue with not supplying options to processUnhandledException
- 1.6.0 - Added support for attaching Tags, added NuGet package
- 1.5.2 - Added Bower package; minor bugfix for Ajax functionality
- 1.5.1 - Capture data submitted by jQuery AJAX calls
- 1.5.0 - Allow IE8 to submit errors over HTTP, updated TraceKit to the latest revision
- 1.4.1 - Fix bug with using jQuery AJAX calls with >= v1.5 of jQuery
- 1.4.0 - AJAX errors will display status code instead of script error
- 1.3.3 - Fixed regression where send()) would no longer attach a custom data object parameter
- 1.3.2 - Fixed the need to call attach() (if only using manual sending)
- 1.3.1 - Added user tracking and version tracking functionality
- 1.3.0 - Updated to latest TraceKit, included removed jQuery support from TraceKit
- 1.2.1 - Added jQuery AJAX error support
- 1.2.0 - Changed from QueryString approach to sending data to using an ajax post with CORS
- 1.0.1 - Initial Release
