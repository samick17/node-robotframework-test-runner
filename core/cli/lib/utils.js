/*
 * @Author: Samick.Hsu
 * @CreatedDate: 2017/08/13
 */
//
(function() {
	const fs = require('fs');
	const path = require('path');

	try {
		Object.defineProperty(String.prototype, 'format', {
			enumerable: false,
			value: function() {
				var s = this,
				i = arguments.length;
				while (i--)
					s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
				return s;
			}
		});
	} catch(e) {
	}
	function zfill(value, ch, length) {
		var result = value.toString();
		for(var i = result.length; i < length; i++) {
			result = ch + result;
		}
		return result;
	}
	module.exports = {
		isDefined: function() {
			var args = arguments;
			var argsToTest;
			if(args.length === 1) {
				argsToTest = args[0];
			} else {
				argsToTest = args;
			}
			if(Array.isArray(argsToTest)) {
				for(var i in argsToTest) {
					var arg = argsToTest[i];
					if(typeof arg === 'undefined') {
						return false;
					}
				}
				return true;
			} else {
				var typeofArgs = typeof argsToTest;
				switch(typeofArgs) {
					case 'object':
					for(var i in argsToTest) {
						var arg = argsToTest[i];
						if(typeof arg === 'undefined') {
							return false;
						}
					}
					return true;
					case 'string':
					return true;
					case 'number':
					return true;
					default:
					return false;
				}
			}
		},
		isOneOfArgDefined: function(args) {
			if(Array.isArray(arg)) {
				for(var i in args) {
					var arg = args[i];
					if(typeof arg !== 'undefined') {
						return true;
					}
				}
				return false;
			} else {
				return typeof args !== 'undefined';
			}
		},
		inheritPrototype: function(childObject, parentObject) {
			var copyOfParent = Object.create(parentObject.prototype);
			copyOfParent.constructor = childObject;
			childObject.prototype = copyOfParent;
		},
		requireDir: function(dirPath) {
			var currentModule = {};
			fs.readdirSync(dirPath).forEach((fName) => {
				var ext = path.extname(fName);
				var baseName = fName.replace(ext, '');
				if(ext === '.js') {
					var moduleObject = require(path.join(dirPath, baseName));
					currentModule[baseName] = moduleObject;
				}
			});
			return currentModule;
		},
		init: function(model, data) {
			var keys = data ? Object.keys(data) : [];
			for(var i in keys) {
				var key = keys[i];
				model[key] = data[key];
			}
		},
		initProperties: function(data, properties, fieldName) {
			fieldName = fieldName || 'properties';
			if(data) {
				if(data[fieldName]) {
					this.init(properties, data[fieldName]);
					data[fieldName] = properties;
					return data;
				} else {
					var result = data;
					result[fieldName] = properties;
					return result;
				}
			} else {
				var result = {};
				result[fieldName] = properties;
				return result;
			}
		},
		getArgumentsRange: function(data, from, to) {
			var args = [];
			to = to || data.length;
			for(var i = from; i <= to; i++) {
				args.push(data[i]);
			}
			return args;
		},
		zfill: zfill
	};
})();

if(module.id === '.') {
	var api = module.exports;
	var chunk = 'asdas';
	console.log(api.isDefined(chunk, 'undefined'));
}