Raygun4Js
==========

[Raygun.io](http://raygun.io) Provider for JavaScript


Installation
====================

To install the provider download raygun.min.js which has been pre-combined with tracekit as a single script to include
in your site.


Usage
====================

The provider provides two functions, the first allows you to manually send errors as part of handling a catch in
your JavaScript code and the second is a window.onerror handler which will catch all unhandled exceptions.

To get started you will need to initialize the provider with your application API key

```
  <script type="text/javascript">
    Raygun.init('yourApiKey');
  </script>
```

To submit manual errors call .send()

```
  try
  {
    // your code
  }
  catch(e)
  {
    // any other error handling
    Raygun.send(e);
  }
```

To attach the window.onerror handler call .attach(), typically inline with initializing the provider

```
  <script type="text/javascript">
    Raygun.init('yourApiKey').attach();
  </script>
```

You can detach the handler by calling .detach()

```
  <script type="text/javascript">
    Raygun.detach();
  </script>
```
