var http = require('http');

http.request({
    protocol: 'http:',
    hostname: 'localhost',
    port: 18080,
    path: '/',
    method: 'GET',


}, function(res){
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
    });
    res.on('end', function() {
        console.log('No more data in response.')
        process.exit(0);
    });
}).end();