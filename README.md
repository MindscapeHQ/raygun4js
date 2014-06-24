# Raygun4js

Raygun.io plugin for JavaScript

## Getting Started

### With Bower

Run `bower install raygun4js`

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

An example:

```javascript
Raygun.init('apikey', {
  allowInsecureSubmissions: true,
  ignoreAjaxAbort: true,
  debugMode: true
}).attach();
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

### Unique user tracking

You can provide the user name or email address of the currently logged in user to Raygun by calling:

```javascript
Raygun.setUser('username_or_email');
```

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

#### Options

Offline saving is **disabled by default.** To get or set this option, call the following after your init() call:

```js
Raygun.saveIfOffline(boolean)
```

If an error is caught and no network connectivity is available (the Raygun API cannot be reached), or if the request times out after 10s, the error will be saved to LocalStorage. This is confirmed to work on Chrome, Firefox, IE10/11, Opera and WinJS.

Limited support is available for IE 8 and 9 - errors will only be saved if the request times out.

## Release History

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
