/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/03/18
 */
//
(function() {

	const CLI = require('./core/cli/index');
	const CLIColor = CLI.CLIColor;
	const TestUtils = (function() {
		const path = require('path');
		const childProcess = require('child_process');
		const exec = childProcess.exec;
		const fork = childProcess.fork;
		const config = require('./config.json');

		function runProcess(execCmd, options) {
			var proc = exec(execCmd, {
				cwd: options.cwd
			});
			proc.stdout.on('data', options.onData || function(data) {
				console.log(data);
			});
			proc.stderr.on('data', options.onError || function(data) {
				console.log(data);
			});
			proc.on('exit', options.onExit);
			return proc;
		}
		function forkProcess(execCmd, args, options) {
			var proc = fork(execCmd, args, {
				cwd: options.cwd,
				stdio: 'ignore'
			});
			return proc;
		}
		function TestContext() {
			this.isTestOutputGenerated = false;
			this.isTestLogGenerated = false;
			this.isTestReportGenerated = false;
			this.countOfTotalCriticalTests = 0;
			this.countOfPassedCriticalTests = 0;
			this.countOfFailedCriticalTests = 0;
			this.countOfTotalTests = 0;
			this.countOfPassedTests = 0;
			this.countOfFailedTests = 0;
			this.isComplete = false;
			this.rpcProc = undefined;
			this.testProc = undefined;
		}
		TestContext.prototype.setOutputPath = function(outputPath) {
			this.isTestOutputGenerated = true;
		};
		TestContext.prototype.setLogPath = function() {
			this.isTestLogGenerated = true;
		};
		TestContext.prototype.setTestPath = function() {
			this.isTestReportGenerated = true;
			this.isComplete = this.isTestOutputGenerated && this.isTestLogGenerated && this.isTestReportGenerated;
		};
		TestContext.prototype.start = function(libPath, testScriptPath) {
			var testContext = this;
			testContext.libPath = libPath;
			testContext.testScriptPath = testScriptPath;
			return new Promise((resolve, reject) => {
				testContext.rpcProc = forkProcess('./core/lib.js', [path.resolve(libPath)], {
					cwd: __dirname
				});
				testContext.testProc = runProcess('pybot  --outputdir '+path.resolve('./output')+' '+testScriptPath, {
					cwd: __dirname,
					onData: function(data) {
						var args;
						if((args = /^Output:(.*)$/gm.exec(data))) {
							var fPath = args[1].trim();
							testContext.setOutputPath(fPath);
						} else if((args = /^Log:(.*)$/gm.exec(data))) {
							var fPath = args[1].trim();
							testContext.setLogPath(fPath);
						} else if((args = /^Report:(.*)$/gm.exec(data))) {
							var fPath = args[1].trim();
							testContext.setTestPath(fPath);
						} else if((args = /(\d+)\scritical tests,\s(\d+)\spassed,\s(\d+)\sfailed/.exec(data))) {
							var testResultArray = data.split('\n');
							testContext.countOfTotalCriticalTests = parseInt(args[1]);
							testContext.countOfPassedCriticalTests = parseInt(args[2]);
							testContext.countOfFailedCriticalTests = parseInt(args[3]);
							if(testResultArray.length >= 2) {
								if((args = /(\d+)\stests total,\s(\d+)\spassed,\s(\d+)\sfailed/.exec(testResultArray[1]))) {
									testContext.countOfTotalTests = parseInt(args[1]);
									testContext.countOfPassedTests = parseInt(args[2]);
									testContext.countOfFailedTests = parseInt(args[3]);
									testContext.status = testContext.countOfTotalTests === testContext.countOfPassedTests ? 'Pass' : 'Fail';
								}
							}
						} else if((args = /.*\| (PASS) \|/.exec(data))) {
							process.stdout.write(data.replace('PASS', CLIColor.toColoredText('PASS', 'LightGreen')));
						} else if((args = /.*\| (FAIL) \|/.exec(data))) {
							process.stdout.write(data.replace('FAIL', CLIColor.toColoredText('FAIL', 'LightRed')));
						} else {
							process.stdout.write(data);
						}
					},
					onError: function(data) {

					},
					onExit: function(data) {
						try {
							testContext.rpcProc.send('exit');
						} catch(err) {
						}
						testContext.rpcProc = undefined;
						testContext.testProc = undefined;
						resolve(testContext);
					}
				});
			});
		};
		function TestRunner() {
			this.testContexts = [];
		}
		TestRunner.prototype.run = function(libPath, testScriptPath) {
			var testRunner = this;
			var newTextContext = new TestContext();
			testRunner.testContexts.push(newTextContext);
			return newTextContext.start(libPath, testScriptPath);
		}
		return {
			createTestRunner: function() {
				return new TestRunner();
			}
		};
	})();
	const testRunner = TestUtils.createTestRunner();
	const fs = require('fs');
	const util = require('util');
	const ErrorMessageOfPathNotSpecified = 'Path of %s doesn\'t exists!\nPlease specify test arguments properly: start <libPath> <testcasesPath>';
	function runTest(lib, testcasePath) {
		return new Promise((resolve, reject) => {
			var errMessageArgs = [];
			if(!fs.existsSync(lib)) {
				errMessageArgs.push(`<libPath>: "${lib}"`);
			}
			if(!fs.existsSync(testcasePath)) {
				errMessageArgs.push(`<testcasesPath>: "${testcasePath}"`);
			}
			if(errMessageArgs.length === 0) {
				testRunner.run(lib, testcasePath)
				.then(resolve, reject);
			} else {
				reject(new Error(CLIColor.toColoredText(util.format(ErrorMessageOfPathNotSpecified, errMessageArgs.join(' & ')), 'LightRed')));
			}
		});
	}
	const ModeHandler = {
		'-test': function() {
			runTest(process.argv[3], process.argv[4])
			.then(() => {
				process.exit();
			}, (err) => {
				console.log();
				process.stdout.write(err.message+'\n>');
			});
		}
	};
	const DefaultHandler = function() {
		CLI.registerCmd('start', (args, callback) => {
			var startTime = new Date().getTime();
			runTest(args[0], args[1])
			.then((result) => {
				var elapsedTime = (new Date().getTime() - startTime) / 1000 + ' sec(s)';
				console.log('==============================================================================');
				console.log(`Total: ${result.countOfTotalTests}`);
				console.log(`Pass: ${result.countOfPassedTests}`);
				console.log(`Fail: ${result.countOfFailedTests}`);
				var status = CLIColor.toColoredText(result.status, result.status === 'Pass' ? 'LightGreen' : 'LightRed');
				console.log(`Result: ${status}`);
				console.log(`Elapsed Time: ${elapsedTime}`);
				console.log('==============================================================================');
				callback();
			}, (err) => {
				console.log();
				process.stdout.write(err.message+'\n>');
			});
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