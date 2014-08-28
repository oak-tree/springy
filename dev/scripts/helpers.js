//#################################################### Helpers ##################################################
	// Array.forEach implementation for IE support..
	// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
	if (!Array.prototype.forEach) {
		Array.prototype.forEach = function(callback, thisArg) {
			var T, k;
			if (this == null) {
				throw new TypeError(" this is null or not defined");
			}
			var O = Object(this);
			var len = O.length >>> 0; // Hack to convert O.length to a UInt32
			if ({}.toString.call(callback) != "[object Function]") {
				throw new TypeError(callback + " is not a function");
			}
			if (thisArg) {
				T = thisArg;
			}
			k = 0;
			while (k < len) {
				var kValue;
				if (k in O) {
					kValue = O[k];
					callback.call(T, kValue, k, O);
				}
				k++;
			}
		};
	}

	var isEmpty = function(obj) {
		for ( var k in obj) {
			if (obj.hasOwnProperty(k)) {
				return false;
			}
		}
		return true;
	};

	String.prototype.format = function() {
	    var formatted = this;
	    for (var i = 0; i < arguments.length; i++) {
	        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
	        formatted = formatted.replace(regexp, arguments[i]);
	    }
	    return formatted;
	};