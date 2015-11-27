/**
 *  单曲播放器包装类。
 *  需要引入http://js.kuwo.cn/swfobject.js
 *  
 *  调用例子如下：
 *  
 *  function callback(ret){
 *     if(ret==1){
 *       //初始化成功
 *     }else{
 *       //初始化失败
 *     }
 *  } 
 *  
 *  var flashvars = {};
 *  var params = {'allowFullScreen':'false', 'wmode':'transparent', 'quality':'high', 'aloowScriptAccess':'always', 'menu':'false', 'allowScriptAccess':'sameDomain', 'FlashVars':'initplay=0&initjs=KW_DqPlayer._playerInitOK&errmethod=KW_DqPlayer._playerInitError'};
 *  var attributes = {};
 *  
 *  //初始化方法 输入：dqPlayerSwfId：swf的id 
 *  //initCallback：播放器初始化后回调，传1为初始化成功，传-1初始化失败
 *  KW_DqPlayer.init('dqPlayerSwf', callback);
 *  swfobject.embedSWF('dqplay.swf', 'dqPlayerSwf', '1', '1', '9.0.0', false, flashvars, params, attributes, KW_DqPlayer._swfInitOK);
 *   
 *  KW_DqPlayer.play('MUSIC_325169'); 
 *  
 *  
 *
 */

var KW_DqPlayer = {
    isIE : !!(window.attachEvent && !window.opera),
    isOpera : !!window.opera,
    isGecko : navigator.userAgent.indexOf("Gecko") > -1 && navigator.userAgent.indexOf("KHTML") == -1,
    isSafari : (navigator.userAgent.indexOf("Safari") > -1),
    isChrome : (navigator.userAgent.indexOf("Chrome") > -1),
    
    swfId : 'dqPlayer',
    swfIinitCount : 0,
    swfInitInterval : null,
    playStatInterval : null,
    playerIniting : false,
    playerInited : false,
    playerInitCallback : null,
    callbacks : {},
    player : null,
    playRetryCount : 0,
    currentRid: '',
    currentSong: null,
    currentArtist: null,
    currentAlbum: null,
    playStartTime: 0,
    
    
    totalTime:0,
    totalBytes:0,
    currentPos:0,
    currentVol:0,
    bufferedBytes:0,
    buffering: true,
    playStat:'stop',
    showLog: false,
    initPlayed : false,
    
    lrcxSwfId: 'dqLrcxSwf',
    lrcxSwfDivId : '',
    lrcx: null,
    curLrcxId: '',
    ptAvailable: null,
    dqLogSended:false,
    
    openLog : function(){
        if(!document.getElementById('kw_dq_logdiv')){
            var d = document.createElement('div');
            d.style.cssText = 'position:absolute;left:0px;top:0px;width:400px;color:red;z-index:999;background-color:#fff';
            d.id = 'kw_dq_logdiv';
            document.body.appendChild(d);
        }
        this.showLog = true;
    },
    
    log : function(logText){
        if(KW_DqPlayer.showLog&&document.getElementById('kw_dq_logdiv')){
            document.getElementById('kw_dq_logdiv').innerHTML += logText + '<br>';
        }
    },
    
    getSwf : function(id){
        if(id==''){
            return null;
        }
        var obj = null;
        if(KW_DqPlayer.isIE){
            obj  = document.getElementById(id);
        }else{
            obj = document[id];
        }
        return obj;
    }, 
    
    /*
     * 初始化方法 输入：dqPlayerSwfId：swf的id initCallback：播放器初始化后回调，传1为初始化成功，传-1初始化失败
     */
    init : function(dqPlayerSwfId, initCallback, initPlayedId, lrcxSwfId){
        KW_DqPlayer.swfId = dqPlayerSwfId;
        var callbs = {};
        if(initCallback!=null&&initCallback.initCallback!=null){
            callbs = initCallback;
        }else{
            callbs.initCallback = initCallback;
        }
        KW_DqPlayer.callbacks = callbs;
        KW_DqPlayer.playerInitCallback = KW_DqPlayer.callbacks.initCallback;
        KW_DqPlayer._swfInitOK();
        if(initPlayedId!=null&&initPlayedId.indexOf('MUSIC_')>=0){
            KW_DqPlayer.currentRid = initPlayedId;
            initPlayed = true;
            KW_DqPlayer.resetPlayStat();
            KW_DqPlayer.playStat = 'play';
            KW_DqPlayer.buffering = true;
            KW_DqPlayer.log('start play ' + KW_DqPlayer.currentRid);
        }
        if(lrcxSwfId!=null&&lrcxSwfId!=''){
            KW_DqPlayer.lrcxSwfId = lrcxSwfId;
        }
    },
    
    /*
     * 播歌，有重试机制
     */
    play : function(rid){
        var playFailed = false;
        if(KW_DqPlayer.player==null||KW_DqPlayer.playerIniting||typeof KW_DqPlayer.player.playSongByrid != 'function'){
            playFailed = true;
        }else{
            try{
                KW_DqPlayer.player.playSongByrid(rid);
                KW_DqPlayer.resetPlayStat();
                KW_DqPlayer.playStartTime = new Date().getTime();
            }catch(e){
                playFailed = true;
            }
        }
        if(playFailed){
            KW_DqPlayer.playRetryCount ++;
            if(KW_DqPlayer.playRetryCount>=20){
                KW_DqPlayer.log('play 20 times failed');
                return;
            }
            setTimeout('KW_DqPlayer.play(\'' + rid + '\')', 500);
            return;
        }else{
            KW_DqPlayer.playStat = 'play';
            KW_DqPlayer.currentRid = rid;
            KW_DqPlayer.buffering = true;
            KW_DqPlayer.log('start play ' + rid);
        }
    },
    
    /*
     * 暂停
     */
    pause:function(){
        if(this.playStat=='stop'){
            return;
        }
        this.playStat = 'pause';
        this.player.stopSong();
        KW_DqPlayer.log('pause song');
    },
    
    /*
     * 回复
     */
    resume:function(){
        if(this.playStat=='stop'){
            return;
        }
        this.playStat = 'play';
        this.player.resumeSong();
        KW_DqPlayer.log('resume song');
    },
    
    /*
     * 停止播歌
     */
    stop:function(){
        this.playStat = 'stop';
        this.player.finalSong();
        this.resetPlayStat();
        KW_DqPlayer.log('stop song');
    },
    
    /*
     * 等待播放器所有接口可用，
     */
    _swfInitOK : function(){ 
        KW_DqPlayer.playerIniting = true;
        KW_DqPlayer.swfInitInterval = setInterval(
            function(){
                KW_DqPlayer.player = KW_DqPlayer.getSwf(KW_DqPlayer.swfId);
                if(KW_DqPlayer.player && KW_DqPlayer.player.setCurrVolmue && typeof KW_DqPlayer.player.setCurrVolmue == 'function' && typeof KW_DqPlayer.player.playSongByrid == 'function') {
                    //播放器接口可用后执行下面代码：
                    KW_DqPlayer.setVolumn(1);
                    
                    clearInterval(KW_DqPlayer.swfInitInterval);
                    if(KW_DqPlayer.swfInitInterval!=null){
                        KW_DqPlayer.swfInitInterval = null;
                    }
                    KW_DqPlayer.log('swf inited');
                    if(!KW_DqPlayer.playerInited){
                        KW_DqPlayer._playerInitOK();
                    }
                    
                } else {
                    KW_DqPlayer.swfIinitCount++;
                    if(KW_DqPlayer.swfIinitCount >= 20) {
                        clearInterval(KW_DqPlayer.swfInitInterval);
                        if(KW_DqPlayer.swfInitInterval!=null){
                            KW_DqPlayer.swfInitInterval = null;
                        }
                        KW_DqPlayer.log('swf init 20 times failed');
                    }
                }
                
            }
        , 1000);
    },
    
    /*
     * 供swf调用，播放器初始化后调用，必须返回1通知swf初始化ok， 调用结束后播放器所有接口可用。
     */
    _playerInitOK : function(){
        if(KW_DqPlayer.playerInited==false){
            KW_DqPlayer.log('in player initok');
            KW_DqPlayer.playerInited = true;
            KW_DqPlayer.playerIniting = false;
            KW_DqPlayer.player = KW_DqPlayer.getSwf(KW_DqPlayer.swfId);
            KW_DqPlayer.log('player loaded');
            if(KW_DqPlayer.playerInitCallback != null ){
                try{
                    if(typeof KW_DqPlayer.playerInitCallback == 'function'){
                        KW_DqPlayer.log('call playerInitCallback function');
                        KW_DqPlayer.playerInitCallback(1);
                    }else{
                        KW_DqPlayer.log('call playerInitCallback string');
                        setTimeout(KW_DqPlayer.playerInitCallback + '(1)',50);
                    }
                }catch(e){}
            }
            KW_DqPlayer.startStatListener();
            KW_DqPlayer.log('player inited');
        }
        return 1;
    },
    
    /*
     * 供播放器调用,出错了会调
     */
    _playerInitError : function(ret){
        if(KW_DqPlayer.playerInitCallback != null ){
            try{
                if(typeof KW_DqPlayer.playerInitCallback == 'function'){
                    KW_DqPlayer.playerInitCallback(ret);
                }else{
                    setTimeout(KW_DqPlayer.playerInitCallback + '(\'' + ret + '\')',50);
                }
            }catch(e){}
        }
        if(KW_DqPlayer.playerInited==true){
            
        }else{
            KW_DqPlayer.playerInited = false;
        }
        KW_DqPlayer.log('player init failed');
    },
    
    /*
     * 开始状态监视
     */
    startStatListener : function(){
        if(KW_DqPlayer.playStatInterval!=null){
            KW_DqPlayer.stopStatListener();
        }
        KW_DqPlayer.playStatInterval = setInterval(KW_DqPlayer.updatePlayStat, 100);
        KW_DqPlayer.log('start listener');
    },
    
    /*
     * 停止状态监视
     */
    stopStatListener : function(){
        if(KW_DqPlayer.playStatInterval!=null){
            clearInterval(KW_DqPlayer.playStatInterval);
            KW_DqPlayer.playStatInterval = null;
            KW_DqPlayer.log('stop listener');
        }
    },
    
    /*
     * 状态监视，更新播放器各种参数
     */
    updatePlayStat : function(){
        var musicObj = null;
        try{
            if(KW_DqPlayer.playerInited && KW_DqPlayer.player!=null){
                var json = KW_DqPlayer.player.getPlayInfo();
                //if(KW_DqPlayer.ptAvailable==null){
                //  KW_DqPlayer.ptAvailable = (typeof json.evalJSON=='function');
                //}
                //if(KW_DqPlayer.ptAvailable!=null&&KW_DqPlayer.ptAvailable==true){
                //  musicObj = json.evalJSON();
                //}else{
                    musicObj = eval("("+ json +")"); 
                //}
            } 
        }catch(e){}
        if(musicObj == null || musicObj.totalBytes == null) {
            return;
        }
        
        if(KW_DqPlayer.buffering) {
            if(!isNaN(musicObj.loadBytes) && !isNaN(musicObj.totalBytes)) {
                KW_DqPlayer.bufferedBytes = parseInt(musicObj.loadBytes);
                KW_DqPlayer.totalBytes = parseInt(musicObj.totalBytes);
            }
            if(KW_DqPlayer.bufferedBytes!=0 && KW_DqPlayer.bufferedBytes == KW_DqPlayer.totalBytes){
                KW_DqPlayer.buffering = false;
            }
        }
        
        //if(KW_DqPlayer.playStat == 'play') {
            if(!isNaN(musicObj.playCurrTime) && !isNaN(musicObj.totalTime)) {
                KW_DqPlayer.totalTime = parseInt(musicObj.totalTime);
                KW_DqPlayer.currentPos = parseFloat(musicObj.playCurrTime);
            }
        //}
            try{
            if(KW_DqPlayer.dqLogSended==false && KW_DqPlayer.currentPos>1 && KW_DqPlayer.currentPos<4 &&KW_DqPlayer.callbacks.dqPlayLog!=null){
                KW_DqPlayer.dqLogSended = true;
                KW_DqPlayer.sendLog('pl_play_log', KW_DqPlayer.callbacks.dqPlayLog + '?rid=' + KW_DqPlayer.currentRid  + '&pos=' + KW_DqPlayer.currentPos);
            }
            
        }catch(e){}
        
        if(KW_DqPlayer.dqLogSended==true && KW_DqPlayer.currentPos<1 ){
            KW_DqPlayer.dqLogSended = false;
        }
        if(musicObj.songName!=null){
             KW_DqPlayer.currentSong = musicObj.songName;
             KW_DqPlayer.currentArtist = musicObj.songArt;
             KW_DqPlayer.currentAlbum = musicObj.songAlbum;
             //KW_DqPlayer.log('set sname=' +  KW_DqPlayer.currentSong + ' sartist=' + KW_DqPlayer.currentArtist + ' salbum=' + KW_DqPlayer.currentAlbum);
        }
    },
    
    /*
     * 重置播放器各种参数
     */
    resetPlayStat : function(){
        KW_DqPlayer.playRetryCount = 0;
        KW_DqPlayer.currentRid = '';
        KW_DqPlayer.totalTime = 0;
        KW_DqPlayer.totalBytes = 0;
        KW_DqPlayer.currentPos = 0;
        KW_DqPlayer.currentVol = 0;
        KW_DqPlayer.bufferedBytes = 0;
        KW_DqPlayer.buffering = false;
        KW_DqPlayer.currentSong = null;
        KW_DqPlayer.currentArtist = null;
        KW_DqPlayer.currentAlbum = null;
        KW_DqPlayer.dqLogSended = false;
        KW_DqPlayer.log('play stat reset');
    },
    
    /*
     * 设置音量，数值范围0-1
     */
    setVolumn : function(vol){
        var ret = this.player.setCurrVolmue(vol);
        KW_DqPlayer.log('set vol=' + vol);
        if(ret!=-1){
            this.currentVol = vol;
            return 1;
        }else{
            return -1;
        }
    },
    
    /*
     * 状取音量
     */
    getVolumn : function(){
        var vol = this.player.getCurrVolmue();
        if(vol!=-1){
            this.currentVol = vol;
        }
        return this.currentVol;
    },
    
    /*
     * 设置播放进度，数值范围0-1，1为到结尾
     */
    setPosition : function(pos){
        var ret = this.player.setplaycurrPos(pos);
        KW_DqPlayer.log('set pos=' + pos);
        if(ret!=-1){
            return 1;
        }else{
            return -1;
        }
    },
    
    /*
     * 取播放进度，返回秒数
     */
    getPosition : function(){
        return this.currentPos;
    },
    
    
    getStat : function(){
        KW_DqPlayer.log('totalBytes: ' + KW_DqPlayer.totalBytes + ' bufferedBytes:' + KW_DqPlayer.bufferedBytes + 'buffering: ' + KW_DqPlayer.buffering);
        KW_DqPlayer.log('totalTime' + KW_DqPlayer.totalTime + ' currentPos' + KW_DqPlayer.currentPos);
        KW_DqPlayer.log('playstat:' + KW_DqPlayer.playStat + ' currentRid:' + KW_DqPlayer.currentRid + ' volumn:' + KW_DqPlayer.getVolumn());
    },
    
    
    /*
     * 歌词相关 设置逐字滚动定时100ms一次
     */
    _lrcxWordRoll : function(){
        try{
            
        if(KW_DqPlayer.lrcx==null||typeof KW_DqPlayer.lrcx.updateLrcState !='function'){
            KW_DqPlayer.lrcx = KW_DqPlayer.getSwf(KW_DqPlayer.lrcxSwfId);
        }
        if(KW_DqPlayer.lrcx!=null && typeof KW_DqPlayer.lrcx.updateLrcState == 'function'){
            KW_DqPlayer.lrcx.updateLrcState(KW_DqPlayer.currentPos);
        }
        }catch(e){KW_DqPlayer.log(e.message)}
    },
    
    /*
     * 歌词相关 设置逐行滚动定时800ms一次
     */
    _lrcxRowRoll : function(){
        try{
        if(KW_DqPlayer.lrcx==null||typeof KW_DqPlayer.lrcx.setTimeRoll !='function'){
            KW_DqPlayer.lrcx = KW_DqPlayer.getSwf(KW_DqPlayer.lrcxSwfId);
        }
        if(KW_DqPlayer.lrcx!=null && typeof KW_DqPlayer.lrcx.setTimeRoll == 'function'){
            KW_DqPlayer.lrcx.setTimeRoll(KW_DqPlayer.currentPos);
        }   
        }catch(e){KW_DqPlayer.log(e.message)}
    },
    
    /*
     * 歌词相关 取歌词id
     */
    _loadLrcxId : function(){
        KW_DqPlayer.log('load lrcxid=' + KW_DqPlayer.curLrcxId);
        KW_DqPlayer.lrcx = KW_DqPlayer.getSwf(KW_DqPlayer.lrcxSwfId);
        return KW_DqPlayer.curLrcxId;       
    },
    
    /*
     * 歌词相关 设置歌词id
     */
    _setLrcxId : function(id){
        return KW_DqPlayer.curLrcxId = id;      
    },
    
    /*
     * 播放列表相关 取用户播放列表
     */
    getUserPlayList : function(){
        if(KW_DqPlayer.player!=null){
            return KW_DqPlayer.player.getPlayListInfo();
        }else{
            return '';
        }
    },
    
    /*
     * 播放列表相关 取用户播放列表
     */
    saveUserPlayList : function(str){
        if(KW_DqPlayer.player!=null){
            return KW_DqPlayer.player.savePlayListInfo(str);
        }else{
            return '';
        }
    },
    
    /*
     * 播放列表相关 取共享对象内容
     */
    getShare : function(key){
        if(KW_DqPlayer.player!=null){
            return KW_DqPlayer.player.getCommShareString(key);
        }else{
            return '';
        }
    },
    
    /*
     * 播放列表相关 保存共享对象内容
     */
    saveShare : function(key,value){
        if(KW_DqPlayer.player!=null){
            return KW_DqPlayer.player.saveCommShareString(key,value);
        }else{
            return '';
        }
    },
    

    sendLog : function(type, sr, count){
        if(count==null){
            count = 1;
        }else{
            count++;
            if(count>10){
                return;
            }
        }
        if(document.readyState=="complete"){
            if(sr.indexOf('?')>0){
                sr += '&ms1=' + new Date().getTime();
            }else{
                sr += '?ms1=' + new Date().getTime();
            }
            if(type=='pl_play_log'){
                var img = new Image();
                img.src=sr;
            }
        }else{
            setTimeout('KW_DqPlayer.sendLog(\'' + type + '\',\'' + sr + '\',' + count + ')',1000);
        }
    
    }