(function(){
    module.exports = {
        action: function(req, res){
            res.writeHeader(200, {
                'Content-Type': 'text/html; charset=utf-8'
            });
            res.end('you visit: service->action');
        }
    };
}());