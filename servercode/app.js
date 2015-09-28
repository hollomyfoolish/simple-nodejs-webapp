'use strict';
var net = require('net'),
    cp = require('child_process'),
    os = require('os');

var cpuNums = os.cpus().length;
var server = net.createServer();

console.log('%s cpus in this server', cpuNums);
server.listen(18888, function(){
    console.log(arguments);
    try{
        for(let i = 0; i < cpuNums; i++){
            cp.fork('./http-server.js').send('master', server);
        }
    }catch(e){
        console.error(e);
    }
    console.log('server run in port: %s', 18888);
    server.close();
});

