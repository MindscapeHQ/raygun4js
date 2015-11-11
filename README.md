# Raygun4js

[Raygun.io][raygunio] plugin for JavaScript

[raygunio]: https://raygun.io

## Getting Started

**Step 1**

Add this snippet to your markup, before the closing `</head>` tag:

```javascript
<script type="text/javascript">
    !function(a,b,c,d,e,f,g,h){a.RaygunObject=e,a[e]=a[e]||function(){
    (a[e].o=a[e].o||[]).push(arguments)},f=b.createElement(c),g=b.getElementsByTagName(c)[0],
    f.async=1,f.src=d,g.parentNode.insertBefore(f,g),h=a.onerror,a.onerror=function(b,c,d,f,g){
    h&&h(b,c,d,f,g),g||(g=new Error(b)),a[e].q=a[e].q||[],a[e].q.push({
    e:g})}}(window,document,"script","//cdn.raygun.io/raygun4js/raygun.min.js","rg4js");
</script>
```

This will fetch the raygun4js script from our CDN asynchronously, so it doesn't block the page load. It will also catch errors that are thrown while the page is loading, and send them when the script is ready.

**Step 2**

Add the following lines to your JS site code and paste in your API key (from your Raygun dashboard), to set up the provider to automatically send errors to your Raygun:

```javascript
<script type="text/javascript">
    rg4js('apiKey', 'paste_your_api_key_here');
    rg4js('enableCrashReporting', true);
</script>
```

This will configure the provider to send to your Raygun app, and to automatically send all unhandled errors.

That's it for the basic setup! See **Usage** below for more info on how to send errors.

## Alternative setup options

Note: This library can now be interacted with in two ways, the V1 API and the V2 API. The V1 API is available as 'public' functions on the global Raygun object, and is intended to be used to control the provider during runtime. Legacy setup methods remain on this API for backwards compatibility with 1.x releases. The V2 API is made available when using the snippet (above), and is used to asynchronously configure the provider during onLoad. This is the recommended approach for new setups.

**Snippet without page load error handler**

If you do not want errors to be caught while the page is loading, [use this snippet here][nohandler].

[nohandler]: https://raw.github.com/MindscapeHQ/raygun4js/master/src/snippet/minified.nohandler.js

### Synchronous methods

Note that using these methods will not catch errors thrown while the page is loading. The script needs to be referenced before your other site/app scripts, and will block the page load while it is being downloaded.

#### With Bower

Run `bower install raygun4js`

#### With NPM

```javascript
npm install raygun4js --save
```

This lets you require the library with tools such as Webpack or Browserify.

#### From NuGet

Visual Studio users can get it by opening the Package Manager Console and typing `Install-Package raygun4js`

#### Manual download

Download the [production version][min] or the [development version][max]. You can also download a version without
the jQuery hooks if you are not using jQuery or you wish to provide your own hooks. Get this as a
[production version][min.vanilla] or [development version][max.vanilla].

[min]: https://raw.github.com/MindscapeHQ/raygun4js/master/dist/raygun.min.js
[max]: https://raw.github.com/MindscapeHQ/raygun4js/master/dist/raygun.js
[min.vanilla]: https://raw.github.com/MindscapeHQ/raygun4js/master/dist/raygun.vanilla.min.js
[max.vanilla]: https://raw.github.com/MindscapeHQ/raygun4js/master/dist/raygun.vanilla.js

## Usage

To send errors manually:

```javascript
try {
  throw new Error('oops');
}
catch(e) {
  Raygun.send(e);
}
```

In order to get stack traces, you need to wrap your code in a try/catch block like above. Otherwise the error hits ```window.onerror``` handler and may only contain the error message, line number, and column number.

You also need to throw errors with ```throw new Error('foo')``` instead of ```throw 'foo'```.

To automatically catch and send unhandled errors, you can attach the automatic window.onerror handler callback:

```javascript
// V2
rg4js('enableCrashReporting', true);

// V1
Raygun.attach();
```

If you need to detach it (this will disable automatic unhandled error sending):

```javascript
Raygun.detach();
```

**IE8**

If you are serving your site over HTTP and want IE8 to be able to submit JavaScript errors then you will
need to set the following setting which will allow IE8 to submit the error over HTTP. Otherwise the provider
will only submit over HTTPS which IE8 will not allow while being served over HTTP.

```javascript
// V2
rg4js('options', {
  allowInsecureSubmissions: true
});

// V1
Raygun.init('yourApiKey', { allowInsecureSubmissions: true });
```

## Documentation

### Differences between Raygun4JS V1 and V2

This provider supports two APIs for interacting with the provider, V1 and V2.

V1 remains unchanged from previous versions, and all current code is backwards compatible. This API is of the form where functions can be called on the global `Raygun` object, for instance `Raygun.init('your_apikey').attach()`.

V2 supports a new API for interacting with the script as it is loaded using the asynchronous snippet. A new global function is made available, `rg4js()` (configurable), which accepts parameters that are applied to the provider once it is download asynchronously. This API is of the form `rg4js('init', 'your_apikey')`.

For initial setup, all functions are interchangeable and available using either method. The public functions available on the global Raygun object can be accessed by calling `rg4js(functionName, value)` and vice versa (with the exception of `send()`).

### Initialization Options

To configure the provider, call this and pass in an options object:

```javascript
// V2
rg4js('options', {
  // Add some or all of the options below
});

//V1
Raygun.init('your_apikey', {
  // Add some or all of the options below
});
```

The second parameter should contain one or more of these keys and a value to customize the behavior:

`allowInsecureSubmissions` - posts error payloads over HTTP. This allows **IE8** to send JS errors

`ignoreAjaxAbort` - User-aborted Ajax calls result in errors - if this option is true, these will not be sent.

`ignoreAjaxError` - Ajax requests that return error codes will not be sent as errors to Raygun if this options is true.

`debugMode` - Raygun4JS will log to the console when sending errors.

`wrapAsynchronousCallbacks` - if set to `false`, async callback functions triggered by setTimeout/setInterval will not be wrapped when attach() is called. _Defaults to true_

`ignore3rdPartyErrors` - ignores any errors that have no stack trace information. This will discard any errors that occur completely
within 3rd party scripts - if code loaded from the current domain called the 3rd party function, it will have at least one stack line
and will still be sent.

`excludedHostnames` - Prevents errors from being sent from certain hostnames (domains) by providing an array of strings or RegExp
objects (for partial matches). Each should match the hostname or TLD that you want to exclude. Note that protocols are not tested.

`excludedUserAgents` - Prevents errors from being sent from certain user agents by providing an array of strings. This is very helpful to exclude errors reported by certain browsers or test automation with `CasperJS`, `PhantomJS` or any other testing utility that sends a custom user agent. If a part of the client's `navigator.userAgent` matches one of the given strings in the array, then the client will be excluded from error reporting.

`disableCrashReporting` - Prevent uncaught errors from being sent.

`disablePulse` - Prevent Pulse real user monitoring events from being sent.

`apiEndpoint` - A string URI containing the protocol, domain and port (optional) where all payloads will be sent to. This can be used to proxy payloads to the Raygun API through your own server. When not set this defaults internally to the Raygun API, and for most usages you won't need to set this.

An example:

```javascript
rg4js('options', {
  allowInsecureSubmissions: true,
  ignoreAjaxAbort: true,
  ignoreAjaxError: true,
  debugMode: true,
  ignore3rdPartyErrors: false,
  wrapAsynchronousCallbacks: true,
  excludedHostnames: ['\.local'],
  excludedUserAgents: ['Mosaic'],
  disableCrashReporting: false,
  disablePulse: false
});
```

### Multiple Raygun objects on a single page

You can now have multiple Raygun objects in global scope. This lets you set them up with different API keys for instance, and allow you to send different errors to more than one application in the Raygun web app.

To create a new Raygun object and use it call:

```javascript
var secondRaygun = Raygun.constructNewRaygun();
secondRaygun.init('apikey');
secondRaygun.send(...);
```

Only one Raygun object can be attached as the window.onerror handler at one time, as *onerror* can only be bound to one function at once. Whichever Raygun object had `attach()` called on it last will handle the unhandle errors for the page. Note that you should use the V1 API to send using the second Raygun object, and it should be created and called once the page is loaded (for instance in an `onload` callback).

### Callback Events

#### onBeforeSend

```javascript
// V2
rg4js('onBeforeSend', function (payload) {
  return payload;
});

// V1
Raygun.onBeforeSend(function (payload) {
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

Raygun.onBeforeSend(myBeforeSend);
```

### Sending custom data

#### On initialization:

Custom data variables (objects, arrays etc) can be added by calling the withCustomData function on the Raygun object:

```javascript
// V2
rg4js('withCustomData', { foo: 'bar' });

// V2
Raygun.withCustomData({ foo: 'bar' });
```

**During a send:**

You can also pass custom data with manual send calls, with the second parameter. This lets you add variables that are in scope or global when handled in catch blocks. For example:

```javascript
Raygun.send(err, [{ foo: 'bar' }];
```

#### Providing custom data with a callback

To send the state of variables at the time an error occurs, you can pass withCustomData a callback function. This needs to return an object. By example:

```javascript
var desiredNum = 1;

function getMyData() {
 return { num: desiredNum };
}

Raygun.withCustomData(getMyData);
```

`getMyData` will be called when Raygun4JS is about to send an error, which will construct the custom data. This will be merged with any custom data provided on a Raygun.send() call.

### Adding tags

The Raygun dashboard can also display tags for errors. These are arrays of strings or Numbers. This is done similar to the above custom data, like so:

**On initialization:**

```javascript
// V2
rg4js('withTags', ['tag1', 'tag2']);

// V1
Raygun.withTags(['tag1', 'tag2']);
```

#### During a send:

Pass tags in as the third parameter:

```javascript
Raygun.send(err, null, ['tag']];
```

#### Adding tags with a callback function

As above for custom data, `withTags` can now also accept a callback function. This will be called when the provider is about to send, to construct the tags. The function you pass to `withTags` should return an array (ideally of strings/Numbers/Dates).

### Affected user tracking

By default, Raygun4JS assigns a unique anonymous ID for the current user. This is stored as a cookie. If the current user changes, to reset it and assign a new ID you can call:

```js
Raygun.resetAnonymousUser();
```

#### Disabling anonymous user tracking

```javascript
// V2
rg4js('options', { disableAnonymousUserTracking: true });

// V1
Raygun.init('apikey', { disableAnonymousUserTracking: true });
```

#### Rich user data

You can provide additional information about the currently logged in user to Raygun by calling:

```javascript
// V2
rg4js('setUser', {
  identifier: 'user_email_address@localhost.local',
  isAnonymous: false,
  email: 'emailaddress@localhost.local',
  firstName: 'Foo',
  fullName: 'Foo Bar',
  uuid: 'BAE62917-ACE8-ab3D-9287-B6A33B8E8C55'
});

// V1
Raygun.setUser('user_email_address@localhost.local', false, 'user_email_address@localhost.local', 'Foo', 'Foo Bar', 'BAE62917-ACE8-ab3D-9287-B6A33B8E8C55');
```

Only `identifier` or the first parameter is required. This method takes additional parameters that are used when reporting over the affected users. the full method signature is:

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

#### Resetting the user

You can now pass in empty strings (or false to `isAnonymous`) to reset the current user for login/logout scenarios.

### Version filtering

You can set a version for your app by calling:

```javascript
// V2
rg4js('setVersion', '1.0.0.0');

// V1
Raygun.setVersion('1.0.0.0');
```

This will allow you to filter the errors in the dashboard by that version. You can also select only the latest version, to ignore errors that were triggered by ancient versions of your code. The parameter should be a string in the format `x.x.x` if you want to get the version sorting in Raygun to work nicely, where x is a non-negative integer.

### Filtering sensitive data

You can blacklist keys to prevent their values from being sent it the payload by providing an array of key names:

```javascript
// V2
rg4js('filterSensitiveData', ['password', 'credit_card']);

// V1
Raygun.filterSensitiveData(['password', 'credit_card']);
```

#### Change filter scope

By default this is applied to the UserCustomData object only (legacy behavior). To apply this to any key-value pair, you can change the filtering scope:

```javascript
// V2
rg4js('setFilterScope', 'all'); // Filter any key in the payload
rg4js('setFilterScope', 'customData'); // Just filter the custom data (default)

// V1
Raygun.setFilterScope('all');
```

You can also pass RegExp objects in the array to `filterSensitiveData`, for controllable matching of keys:

```javascript
var creditCardDataRegex = /credit\D*/; // Remove any keys that begin with 'credit'

// V2
rg4js('filterSensitiveData', [creditCardDataRegex]);

// V1
Raygun.filterSensitiveData([creditCardDataRegex]);
```

### Source maps support

Raygun4JS now features source maps support through the transmission of column numbers for errors, where available. This is confirmed to work in recent version of Chrome, Safari and Opera, and IE 10 and 11. See the [Raygun souce maps documentation][sourcemaps] for more information.

[sourcemaps]: https://raygun.io/docs/workflow/source-maps

### Offline saving

The provider has a feature where if errors are caught when there is no network activity they can be saved (in Local Storage). When an error arrives and connectivity is regained, previously saved errors are then sent. This is useful in environments like WinJS, where a mobile device's internet connection is not constant.

Offline saving is **disabled by default.** To change it:

```javascript
// V2
rg4js('saveIfOffline', true);

// V1
Raygun.saveIfOffline(true);
```

If an error is caught and no network connectivity is available (the Raygun API cannot be reached), or if the request times out after 10s, the error will be saved to LocalStorage. This is confirmed to work on Chrome, Firefox, IE10/11, Opera and WinJS.

Limited support is available for IE 8 and 9 - errors will only be saved if the request times out.

### Errors in scripts on other domains

Browsers have varying behavior for errors that occur in scripts located on domains that are not the origin. Many of these will be listed in Raygun as 'Script Error', or will contain junk stack traces. You can filter out these errors by settings this:

```javascript
// V2
rg4js('options', { ignore3rdPartyErrors: true });

// V1
Raygun.init('apikey', { ignore3rdPartyErrors: true });
```

#### Whitelisting domains

There is also an option to whitelist domains which you **do** want to allow transmission of errors to Raygun, which accepts the domains as an array of strings:

```javascript
// V2
rg4js('options', { ignore3rdPartyErrors: true });
rg4js('whitelistCrossOriginDomains', ['code.jquery.com']);

// V1
Raygun.init('apikey', { ignore3rdPartyErrors: true }).whitelistCrossOriginDomains(['code.jquery.com']);
```

This can be used to allow errors from remote sites and CDNs.

The provider will default to attempt to send errors from subdomains - for instance if the page is loaded from foo.com, and a script is loaded from cdn.foo.com, that error will be transmitted on a best-effort basis.

To get full stack traces from cross-origin domains or subdomains, these requirements should be met:

* The remote domain should have `Access-Control-Allow-Origin` set (to include the domain where raygun4js is loaded from).

* For Chrome the `script` tag must also have `crossOrigin="Anonymous"` set.

* Recent versions of Firefox (>= 31) will transmit errors from remote domains will full stack traces if the header is set (`crossOrigin` on script tag not needed).

In Chrome, if the origin script tag and remote domain do not meet these requirements the cross-origin error will not be sent.

Other browsers may send on a best-effort basis (version dependent) if some data is available but potentially without a useful stacktrace. The provider will cancel the send if no data is available.

## Release History

[View the changelog here](CHANGELOG.md)