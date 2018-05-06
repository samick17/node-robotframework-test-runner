/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/05/04
 */
//
(function() {
	const fs = require('fs');
	const path = require('path');
	function parseFromFile(fPath) {
		var chunk = '';
		var handler = defaultHandler;
		var settings = {};
		var variables = {};
		var defaultHandler = {
			canSwitch: true,
			fn: function(chunk) {
				if(chunk) {
				} else {
					switchHandler(chunk);
				}
			}
		};
		var settingsRe = [
		{
			re: /(Suite Setup)\s(.*)/
		},
		{
			re: /(Suite Teardown)\s(.*)/
		},
		{
			re: /(Test Setup)\s(.*)/
		},
		{
			re: /(Test Teardown)\s(.*)/
		},
		{
			re: /(Force Tags)\s(.*)/
		},
		{
			re: /(Default Tags)\s(.*)/
		},
		{
			re: /(Test Timeout)\s(.*)/
		},
		{
			re: /(Metadata)\s(.*)/,
			parse: function(chunk) {
				var re = this.re;
				var reResult = re.exec(chunk);
				if(reResult) {
					var valueArray = reResult[2].trim().split('    ');
					return {
						key: reResult[1],
						name: valueArray[0],
						value: valueArray[1],
						comment: valueArray[2]
					};
				}
			}
		},
		{
			re: /(Library)\s(.*)/,
			parse: function(chunk) {
				var re = this.re;
				var reResult = re.exec(chunk);
				if(reResult) {
					var valueArray = reResult[2].trim().split('    ');
					return {
						key: reResult[1],
						import: reResult[1],
						path: valueArray[0],
						args: valueArray[1],
						comment: valueArray[2]
					};
				}
			}
		}
		];
		var variablesRe = /\${(.*)}\s(.*)/;
		var testcases = [];
		var settingsHandler = {
			canSwitch: true,
			fn: function(chunk) {
				if(chunk) {
					var data;
					for(var i in settingsRe) {
						var reData = settingsRe[i];
						var re = reData.re;
						if(reData.parse) {
							data = reData.parse(chunk);
							if(data) {

								break;
							}
						} else {
							var reResult = re.exec(chunk);
							if(reResult) {
								var valueArray = reResult[2].trim().split('    ');
								data = {
									key: reResult[1],
									value: valueArray[0]
								};
								break;
							}
						}
					}
					if(data) {
						settings[data.key] = data;
					}
				} else {
					switchHandler(chunk);
				}
			}
		};
		var variablesHandler = {
			canSwitch: true,
			fn: function(chunk) {
				if(chunk) {
					var reResult = variablesRe.exec(chunk);
					var key = '', value = '', comment = '';
					if(reResult) {
						key = reResult[1];
						var valueArray = reResult[2].trim().split('    ');
						value = valueArray[0];
						comment = valueArray[1];
					}
					variables[key] = {
						value: value,
						comment: comment
					};
				} else {
					switchHandler(chunk);
				}
			}
		};
		var testCasesHandler = {
			canSwitch: false,
			fn: function(chunk) {
				if(chunk) {
					if(chunk.substring(0, 4) === '    ') {
					} else {
						testcases.push(chunk.trim());
					}
				}
			}
		};

		function switchHandler(chunk) {
			if(chunk) {
				data = chunk.trim();
				switch(data) {
					case '*** Settings ***':
					handler = settingsHandler;
					return true;
					case '*** Variables ***':
					handler = variablesHandler;
					return true;
					case '*** Test Cases ***':
					handler = testCasesHandler;
					return true;
					case '':
					if(handler.canSwitch) {
						handler = defaultHandler;
					}
					return true;
					default:
					return false;
				}
			} else {
				return false;
			}
		}

		function handleChunk() {
			var data = chunk;
			if(!switchHandler(data)) {
				handler.fn(data);
			}
			chunk = '';
		}
		return new Promise((resolve, reject) => {
			var fileName = path.basename(fPath);
			var rs = fs.createReadStream(fPath);
			rs.on('data', (data) => {
				var chunkArray = data.toString().split('\n');
				for(var i = 0; i < chunkArray.length - 1; i++) {
					var temp = chunkArray[i];
					chunk += temp;
					handleChunk();
				}
				chunk += chunkArray[chunkArray.length - 1];
			});
			rs.on('close', () => {
				handleChunk();
				resolve({
					fileName: fileName,
					settings: settings,
					variables: variables,
					testcases: testcases
				});
			});
		});
	}
	function parseFromFolder(fPath) {
		return new Promise((resolve, reject) => {
			fs.readdir(fPath, (err, files) => {
				if(err) {
					reject(err);
				} else {
					var testcaseData = [];
					return Promise.all(files.map((fileName) => {
						var absFilePath = path.resolve(path.join(fPath, fileName));
						return parseFromFile(absFilePath);
					}))
					.then(resolve, reject);
				}
			});
		});
	}
	function parse(fPath) {
		return new Promise((resolve, reject) => {
			fs.stat(fPath, (err, data) => {
				if(err) {
					reject(err);
				} else {
					if(data.isFile()) {
						return parseFromFile(fPath)
						.then((data) => {
							resolve([data]);
						}, reject);
					} else {
						return parseFromFolder(fPath)
						.then(resolve, reject);
					}
				}
			});
		});
	}
	/*parse('../../testcases')
	.then((data) => {
		console.log(data);
	});*/
	module.exports = {
		parse: parse
	};
})();