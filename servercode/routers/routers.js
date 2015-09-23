(function(){
    'use strict';
    var mime = require('mime'),
        fs = require('fs'),
        path = require('path');
    var routers = [],
        services,
        slice = Array.prototype.slice;

    services = {
        defaultService: function(req, res){
            res.writeHeader(404);
            res.end();
        },

        staticResourceService: function(req, res){
            let filepath = path.resolve('../public/', req.pathname.substring(5)).toString();
            try{
                if(!fs.statSync(filepath).isFile()){
                    res.writeHeader(404, {
                        'Content-Type': 'text/html; charset=utf-8'
                    });
                    res.end(req.pathname + ' is not exisited!');
                }
                let readStream = fs.createReadStream(filepath);
                res.writeHeader(200, {
                    'Content-Type': mime.lookup(filepath)
                });
                readStream.pipe(res, {end: false});
                readStream.on('end', function(){
                    res.end();
                });
            }catch(e){
                res.writeHeader(404, {
                    'Content-Type': 'text/html; charset=utf-8'
                });
                res.end(e.toString());
            }
        }
    };

    function getService(path){
        if(path.startsWith('/res')){
            return services.staticResourceService;
        }

        let paths = path.substring(1).split('/');
        if(paths.length < 3){
            console.log('no such service');
            return services.defaultService;
        }
        let context = paths[0],
            moduleName = paths[1],
            serviceName = paths[2],
            args = slice.call(paths, 3);

        try{
            let module = require('../controllers/' + moduleName + '.js');
            if(typeof module[serviceName] === 'function'){
                return function(_req, _res){
                    module[serviceName].apply(module, [_req, _res].concat(args));
                }
            }else{
                console.error('no such service['+ serviceName +'] in module[' + moduleName + ']');
                return services.defaultService;
            }
        }catch(e){
            console.error('no such module[' + moduleName + ']', e);
            return services.defaultService;
        }
    }

    module.exports = {
        getService: getService
    };

}());
