/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/03/03
 */
//
(function() {
	const fs = require('fs');
	const robot = require('robotremote');
	const config = require('../config.json');
	const Utils = require('./cli/lib/utils');
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
		var server = new robot.Server([lib], {
			host: config.host,
			port: config.port,
			timeout: config.timeout
		});
		return server;
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
		const path = require('path');
		var argumentsText = process.argv.slice(2).join(' ');
		var args = Utils.parseArgsFromText(argumentsText);
		var libPath = args.lib;
		if((path.isAbsolute(libPath) && fs.existsSync(libPath)) || fs.existsSync(path.resolve(path.join(__dirname, libPath)))) {
			switch(args.m) {
				default:
				api.init(require(libPath));
				break;
			}
		} else {
			throw new Error(`Library: ${libPath} not found!`);
		}
	}
})();