self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('v1').then(function(cache) {
            return cache.addAll([
                '/assets/',
                '/assets/js/Main.class.js',
                '/assets/js/Db.class.js',
                '/assets/js/app.js',
                '/assets/js/mask.js',
                '/assets/css/app.css',
                '/assets/img/i192.png',
                '/assets/img/i144.png',
                '/assets/img/i512.png',
                '/assets/img/baronni-logo.jpg'
            ]);
        })
    );
});
  
self.addEventListener('fetch', function(event) {

    function isHtmlRequest(req){
        return req.headers.get('Accept').indexOf('text/html') !== -1;
    }

    if(event.request.method !== 'GET') {
        
        if (!navigator.onLine && isHtmlRequest(request)) {
            return event.respondWith(caches.match(offlinePage));
        }
        return;
    }

    event.respondWith(caches.match(event.request).then(function(response) {

        if (response !== undefined) {
            return response;
        } else {
            
            return fetch(event.request).then(function (response) {

                let responseClone = response.clone();
          
                caches.open('v1').then(function (cache) {
                    cache.put(event.request, responseClone);
                });
            
                return response;
        
            }).catch(function () {        
                return caches.match('/assets/img/baronni-logo.jpg');
            });

        }
    }));
});

self.addEventListener('push', function(event) {

    const title = 'Push';
    const options = {
        body : 'PUSH NOTIFICATION',
        icon : '/assets/img/i192.jpg',
        badge : '/assets/img/i512.jpg'
    };

    event.waitUntil(self.registration.showNotification(title, options))

});

self.addEventListener('activate', function(event){
   
    var cacheWhiteList = ['v2'];

    event.waitUntil(
        caches.keys().then(function(keyList){
            return Promise.all(keyList.map(function(key){
                if(cacheWhiteList.indexOf(key)){
                    return caches.delete(key);
                }
            }))
        })
    );

});