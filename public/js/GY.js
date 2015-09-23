/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 * http://ejohn.org/blog/simple-javascript-inheritance/
 */
// Inspired by base2 and Prototype

var GY = GY || {};
(function (global) {
	GY.ns = function (namespace) {
		var tmp = global;
		var parts = namespace.split('.');
		for(var index = 0; index < parts.length; index++){
			if(!tmp[parts[index]]){
				tmp[parts[index]] = {};
			}
			tmp = tmp[parts[index]];
		}
		
		return tmp;
	};
	
	GY.ns('GY.Dom');
	GY.Dom = {
	    byId: function(id){
	        return document.getElementById(id);
	    }
	};
	
	var initialize = true;
	var fnTest = /xyz/.test(function () {xyz})? /\b_super\b/ : /.*/;
	
	function Class () {
		
	}
	
	Class.prototype = {
		init: function () {
			console.log('init the original Class');
		}
	};
	
	Function.prototype.extend = function (props) {
		var _super = this.prototype;
		
		initialize = false;
		var prototype = new this();
		initialize = true;
		
		for(var name in props){
			prototype[name] = typeof props[name] === 'function' && typeof _super[name] === 'function' && fnTest.test(props[name])?
				(function (_name, fn) {
					return function () {
						var tmp = this._super;
						this._super = _super[_name];
						var ret = fn.apply(this, arguments);
						this._super = tmp;
						
						return ret;
					};
				} (name, props[name])) : props[name];
		}
		
		function DummyClass(){
			if(initialize && this.init){
				this.init.apply(this, arguments);
			}
		}
		
		DummyClass.prototype = prototype;
		DummyClass.prototype.constructor = DummyClass;
		
		return DummyClass;
	};
	
	GY.Class = Class;
	
	GY.ns('GY.eventBus');
	GY.eventBus = (function () {
	    var events = {};
	    
	    return {
	        publish: function (eventName, data) {
	            events[eventName] = events[eventName] || [];
	            events[eventName].forEach(function (fn) {
	                fn(eventName, data);
	            });
	        },
	        
	        subscribe: function (eventName, fn) {
	            events[eventName] = events[eventName] || [];
	            events[eventName].push(fn);
	        },
	        
	        unsubscribe: function (eventName, fn) {
	            events[eventName] = events[eventName] || [];
	            events[eventName] = events[eventName].filter(function (_fn) {
	                return !(_fn === fn);
	            });
	        }
	    };
	} ());
	
	GY.ns('GY.Base64');
	GY.Base64 = (function () {
	    var END_OF_INPUT = -1;
	    var base64Chars = new Array("A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/");
	    var reverseBase64Chars = new Array();
	    for (var i = 0; i < base64Chars.length; i++) {
	        reverseBase64Chars[base64Chars[i]] = i
	    }
	    var base64Str;
	    var base64Count;
	    function setBase64Str(a) {
	        base64Str = a;
	        base64Count = 0
	    }
	    function readReverseBase64() {
	        if (!base64Str) {
	            return END_OF_INPUT
	        }
	        while (true) {
	            if (base64Count >= base64Str.length) {
	                return END_OF_INPUT
	            }
	            var a = base64Str.charAt(base64Count);
	            base64Count++;
	            if (reverseBase64Chars[a]) {
	                return reverseBase64Chars[a]
	            }
	            if (a == "A") {
	                return 0
	            }
	        }
	        return END_OF_INPUT
	    }
	    function ntos(a) {
	        a = a.toString(16);
	        if (a.length == 1) {
	            a = "0" + a
	        }
	        a = "%" + a;
	        return unescape(a)
	    }
	    function decodeBase64(d) {
	        setBase64Str(d);
	        var a = "";
	        var c = new Array(4);
	        var b = false;
	        while (!b && (c[0] = readReverseBase64()) != END_OF_INPUT && (c[1] = readReverseBase64()) != END_OF_INPUT) {
	            c[2] = readReverseBase64();
	            c[3] = readReverseBase64();
	            a += ntos((((c[0] << 2) & 255) | c[1] >> 4));
	            if (c[2] != END_OF_INPUT) {
	                a += ntos((((c[1] << 4) & 255) | c[2] >> 2));
	                if (c[3] != END_OF_INPUT) {
	                    a += ntos((((c[2] << 6) & 255) | c[3]))
	                } else {
	                    b = true
	                }
	            } else {
	                b = true
	            }
	        }
	        return a
	    }
	    
	    return {
	        decoder: decodeBase64
	    };
	} ());
	
	GY.ns('GY.panel.Panel');
	GY.panel.Panel = GY.Class.extend({
	    init: function (opts) {
	        opts = opts || {};
	        this.width = opts.width || 400;
	        this.height = opts.height || 300;
	        this.html = opts.html || '';
	        this.dom = null;
	        this.renderTo = opts.renderTo;
	        this.isRendered = false;
	        this.parentEl = document.getElementById(this.renderTo) || document.body;
	    },
	    
	    getDom: function () {
	        if(!this.dom){
	            this.dom = document.createElement('div');
	            this.dom.innerHTML = this.html;
	            this.dom.style.cssText = 'position: absolute;width: ' + this.width + 'px;height: ' + this.height + 'px;border: 1px solid gray;';
	        }
	        return this.dom;
	    },
	    
	    show: function () {
	        if(!this.isRendered){
	            this.parentEl.appendChild(this.getDom());
	            this.isRendered = true;
	        }
	        this.getDom().style.display = 'block';
	    },
	    
	    hide: function () {
	        if(this.isRendered){
	            this.getDom().style.display = 'none';
	        }
	    }
	});
	
	GY.ns('GY.panel.SlidPanel');
	GY.panel.SlidPanel = GY.panel.Panel.extend({
        init: function (opts) {
            this._super(opts);
            this.slids = [];
        },
        
        addSlid: function (slid) {
            this.slids.push(slid);
        }
    });
	
	
	GY.ns('GY.Ability');
	GY.Ability = {
	    scrollable: function(divEl, onScrollBottom){
	        divEl.style.overflow = 'auto';
	        divEl.addEventListener('scroll', function (e) {
	            console.log('scrollTop: ' + divEl.scrollTop);
	            console.log('clientHeight: ' + divEl.clientHeight);
	            console.log('scrollHeight: ' + divEl.scrollHeight);
	            if(divEl.scrollTop + divEl.clientHeight === divEl.scrollHeight){
	                if(onScrollBottom){
	                    onScrollBottom();
	                }
	            }
	        });
	    }
	};
	
	GY.ns('GY.control.Table');
	GY.control.Table = function (module) {
	    this._module = module || [];
	};
	GY.control.Table.prototype = {
	    
	};
	
	GY.ns('GY.common.FuncFactory');
	GY.common.FuncFactory = {
	    callWhileChecked: function (check, callback) {
	        if(check()){
	            callback();
	        }
	    }
	};
	GY.ns('GY.string.StringUtil');
	function getBytes4UtfCharCode (charCode) {
        if (charCode >= 0x00 && charCode <= 0x7F) {
            return 1;
        } else if (charCode <= 0x7FF) {
            return 2;
        } else if (charCode <= 0xFFFF) {
            return 3;
        } else if (charCode <= 0x1FFFFF) {
            return 4;
        } else if (charCode <= 0x3FFFFFF) {
            return 5;
        } else if (charCode <= 0x7FFFFFFF) {
            return 6;
        }
        return 0;
    }
	GY.string.StringUtil = {
	    getRealLen4UTF8: function (s) {
	        if (!s || typeof s !== 'string') {
	           return 0; 
	        }
	        var i,
	            realLen = 0,
	            len = s.length;
	        for (i = 0; i < len; i++) {
	            realLen += getBytes4UtfCharCode(s.charCodeAt(i));
	        }
	        
	        return realLen;
	    }
	};
} (window));