'use strict';
var http = require('http'),
    fs = require('fs'),
    urlParser = require('url'),
    formidable = require('formidable'),
    routers = require('./routers/routers.js');

function  getContentType(req){
    let contentType = req.headers['content-type'] || '';
    return contentType.split(';')[0];
}

var worker = http.createServer(function(req, res){
    let url = urlParser.parse(req.url, true),
        method = req.method.toLowerCase(),
        contentType = getContentType(req);

    req.pathname = url.pathname;
    if(method === 'post' && (contentType.indexof('application/x-www-form-urlencoded') >= 0 || contentType.indexof('multipart/form-data') >= 0)){
        let form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files){
            req.params = fields;
            req.files = files;
            routers.getAction(req.url)(req, res);
        });
        return;
    }

    req.params = urlParser.parse(req.url, true).query;
    routers.getService(url.pathname)(req, res);
    return;
});

process.on('message', function(msg, master){
    master.on('connection', function(socket){
        worker.emit('connection', socket);
    });
});
