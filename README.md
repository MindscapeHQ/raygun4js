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

To submit manual errors (Currently you still need to call attach() in order to send an error, this is a bug that will be fixed):

```javascript
// You only need to init and attach once.
Raygun.init('yourApiKey').attach();
try {
  // your code
}
catch(e) {
  Raygun.send(e);
}
```

To attach the window.onerror handler call:

```html
<script src="dist/raygun.min.js"></script>
<script>
  Raygun.init('yourApiKey').attach();
</script>
```

If you need to detach it:

```javascript
Raygun.detach();
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Release History

- 1.3.0 - Updated to latest TraceKit, included removed jQuery support from TraceKit
- 1.2.1 - Added jQuery AJAX error support
- 1.2.0 - Changed from QueryString approach to sending data to using an ajax post with CORS
- 1.0.1 - Initial Release
