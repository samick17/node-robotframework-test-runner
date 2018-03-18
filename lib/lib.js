/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/03/03
 */
//
(function() {
	var fs = require('fs');
	var readdir = require('promise').denodeify(fs.readdir);
	var robot = require('robotremote');
	var assert = require('assert');
	function createRobotLibrary(keywordDefs) {
		var lib = {};
		keywordDefs.forEach(function(defData) {
			var keywordFn = defData.fn;
			keywordFn.doc = defData.doc;
			lib[defData.name] = keywordFn;
		});
		return lib;
	}
	function initByDefs(libDefinitions) {
		var lib = module.exports = createRobotLibrary(libDefinitions);
		var server = new robot.Server([lib], { host: 'localhost', port: 8270 });
	}

	var api = module.exports = {
		init: function(arg) {
			if(Array.isArray(arg)) {
				initByDefs(arg);
			} else {
				throw new Error(`Invalid arguments: ${arg}!`);
			}
		}
	};
	if(module.id === '.') {
		var libPath = process.argv[2];
		if(typeof libPath === 'string') {
			if(fs.existsSync(libPath)) {
				api.init(require(libPath));
			} else {
				throw new Error(`Library: ${libPath} not found!`);
			}
		}
	}
})();