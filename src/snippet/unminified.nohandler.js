(function(wind, doc, scriptTag, url, obj, s, n) {
    wind['RaygunObject'] = obj;
    wind[obj] = wind[obj] || function() {
        (wind[obj].o = wind[obj].o || []).push(arguments)
    },
    s = doc.createElement(scriptTag),
    n = doc.getElementsByTagName(scriptTag)[0];
    s.async = 1;
    s.src = url;
    n.parentNode.insertBefore(s, n);
})(window, document, 'script', '//cdn.raygun.io/raygun4js/raygun.min.js', 'rg4js');