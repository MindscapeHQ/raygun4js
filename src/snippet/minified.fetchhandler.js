!function(a,b,c,d,e,f,g,h,i,j){a.RaygunObject=e,a[e]=a[e]||function(){
(a[e].o=a[e].o||[]).push(arguments)},g=b.createElement(c),h=b.getElementsByTagName(c)[0],
g.async=1,g.src=d,a.__raygunNoConflict=!!f,h.parentNode.insertBefore(g,h),i=a.onerror,
a.onerror=function(b,c,d,f,g){i&&i(b,c,d,f,g),g||(g=new Error(b)),a[e].q=a[e].q||[],
a[e].q.push({e:g})},j=a.fetch,j&&(a.__raygunOriginalFetch=j,a.fetch=function(){
return a.__raygunFetchCallback?a.__raygunFetchCallback.apply(null,arguments):j.apply(null,arguments);
})}(window,document,"script","//cdn.raygun.io/raygun4js/raygun.min.js","rg4js");