(function() {
    'use strict';
    
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options) {
        return originalFetch.apply(this, arguments)
            .catch(function(error) {
                console.error('[WRAPPER] Fetch failed:', error);
                throw error;
            })
            .then(function(response) {
                if (!response.ok) {
                    console.error('[WRAPPER] Fetch response error:', response.status, response.statusText, 'for URL:', url);
                }
                return response;
            });
    };
})();
