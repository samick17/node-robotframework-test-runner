/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/03/18
 */
//
(function() {

	const fs = require('fs');
	const path = require('path');
	const CLI = require('./core/cli/index');
	const Utils = require('./core/cli/lib/utils');
	const TestCaseParser = require('./core/misc/testcases-parser');
	const TestOutputParser = require('./core/misc/testoutput-parser');
	const TestUtils = require('./core/misc/test-utils');

	const testRunner = TestUtils.createTestRunner(__dirname);
	const ErrorMessageOfPathNotSpecified = 'Path of {0} doesn\'t exists!\nPlease specify test arguments properly: start <libPath> <testcasesPath> [testCaseName] [includeTags] [excludeTags]';
	function runTest(lib, testcasePath, testCaseName, includeTags, excludeTags) {
		return new Promise((resolve, reject) => {
			var errMessageArgs = [];
			if(!fs.existsSync(lib)) {
				errMessageArgs.push(`<libPath>: "${lib}"`);
			}
			if(!fs.existsSync(testcasePath)) {
				errMessageArgs.push(`<testcasesPath>: "${testcasePath}"`);
			}
			if(errMessageArgs.length === 0) {
				testRunner.run(lib, testcasePath, testCaseName, includeTags, excludeTags)
				.then(resolve, reject);
			} else {
				reject(new Error(ErrorMessageOfPathNotSpecified.format(errMessageArgs.join(' & '))));
			}
		});
	}
	const ModeHandler = {
		'-test': function() {
			var libPath = process.argv[3];
			var testcasesDirectoryPath = process.argv[4];
			var testCaseName = process.argv[5];
			var includeTags = process.argv[6];
			var excludeTags = process.argv[7];
			runTest(libPath, testcasesDirectoryPath, testCaseName, includeTags, excludeTags)
			.then(() => {
				process.exit();
			}, (err) => {
				console.log();
				process.stdout.write(err.message.clrLightRed()+'\n>');
				console.log(err.stack);
			});
		},
		'-genstatistics': function() {
			TestOutputParser.generateReport(__dirname, 'output')
			.then((trendStatistics) => {
				console.log('generate trend report complete!');
			});
		}
	};
	const DefaultHandler = function() {
		CLI.registerCmd('start', {
			args: {
				lib: {
					required: true,
					name: 'library',
					sample: './lib.js'
				},
				p: {
					required: true,
					name: 'testcase path',
					sample: './testcases'
				}
			},
			fn: function(argsMap, callback) {
				var libPath = argsMap.lib;
				var testcasesDirectoryPath = argsMap.p;
				var testCaseName = argsMap.t;
				var includeTags = argsMap.i;
				var excludeTags = argsMap.e;
				runTest(libPath, testcasesDirectoryPath, testCaseName, includeTags, excludeTags)
				.then(() => {
					callback();
				});
			}
		});
		CLI.registerCmd('ls', {
			args: {
				p: {
					required: true,
					name: 'path',
					sample: './testcases'
				}
			},
			fn: function(argsMap, callback) {
				var testcasesPath = argsMap.p;
				TestCaseParser.parse(testcasesPath)
				.then((testcases) => {
					console.log();
					console.log('==============================================================================');
					testcases.map((testcaseData) => {
						var testcaseFileName = testcaseData.fileName.clrLightGreen();
						console.log(`[TestCaseFile]: ${testcaseFileName}`);
						console.log('==============================================================================');
						console.log('[TestCases]');
						testcaseData.testcases.forEach((testcaseName, i) => {
							console.log(`${i+1}. ${testcaseName}`);
						});
						console.log('==============================================================================');
					});
					callback();
				}, (err) => {
					process.stdout.write(err.message.clrLightRed()+'\n>');
					console.log(err.stack);
				});
			}
		});
		CLI.registerCmd('run', {
			args: {

			},
			fn: function(args, callback) {
				var argsMap = Utils.parseArgsFromText(args.join(' '));
			}
		});
		CLI.printMenu();
		CLI.start();
	}
	var handler = ModeHandler[process.argv[2]];
	if(handler) {
		handler();
	} else {
		DefaultHandler();
	}
})();