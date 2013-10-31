# Raygun4js

Raygun.io plugin for JavaScript

## Getting Started
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/MindscapeHQ/raygun4js/master/dist/raygun.min.js
[max]: https://raw.github.com/MindscapeHQ/raygun4js/master/dist/raygun.js

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
}
catch(e) {
  Raygun.send(e);
}
```

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

## Documentation

### Sending custom data

Custom data variables can be placed in an array passed in as the third parameter in the init() call. For instance:

```javascript
Raygun.init('{{your_api_key}}', null, ['the user name']).attach();
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

## Release History

- 1.3.3 - Fixed regression where send()) would no longer attach a custom data object parameter
- 1.3.2 - Fixed the need to call attach() (if only using manual sending)
- 1.3.1 - Added user tracking and version tracking functionality
- 1.3.0 - Updated to latest TraceKit, included removed jQuery support from TraceKit
- 1.2.1 - Added jQuery AJAX error support
- 1.2.0 - Changed from QueryString approach to sending data to using an ajax post with CORS
- 1.0.1 - Initial Release
