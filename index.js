/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/03/18
 */
//
(function() {

	var TestUtils = (function() {
		var path = require('path');
		var childProcess = require('child_process');
		var exec = childProcess.exec;
		var fork = childProcess.fork;
		const CLIColor = require('./cli/index').CLIColor;

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
				testContext.rpcProc = forkProcess('./lib/lib.js', [path.resolve(libPath)], {
					cwd: __dirname
				});
				testContext.testProc = runProcess('pybot  --outputdir '+path.resolve('./output')+' '+testScriptPath, {
					cwd: __dirname,
					onData: function(data) {
						var args;
						if((args = /^Output:(.*)$/.exec(data))) {
							var fPath = args[1].trim();
							testContext.setOutputPath(fPath);
						} else if((args = /^Log:(.*)$/.exec(data))) {
							var fPath = args[1].trim();
							testContext.setLogPath(fPath);
						} else if((args = /^Report:(.*)$/.exec(data))) {
							var fPath = args[1].trim();
							testContext.setTestPath(fPath);
						} else if((args = /(\d+)\scritical tests,\s(\d+)\spassed,\s(\d+)\sfailed/.exec(data))) {
							var testResultArray = data.split('\n');
							testContext.countOfTotalCriticalTests = args[1];
							testContext.countOfPassedCriticalTests = args[2];
							testContext.countOfFailedCriticalTests = args[3];
							if(testResultArray.length >= 2) {
								if((args = /(\d+)\stests total,\s(\d+)\spassed,\s(\d+)\sfailed/.exec(testResultArray[1]))) {
									testContext.countOfTotalTests = args[1];
									testContext.countOfPassedTests = args[2];
									testContext.countOfFailedTests = args[3];
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
	var testRunner = TestUtils.createTestRunner();
	function runTest() {
		return testRunner.run('./app-lib.js', './testcases/test.txt')
	}
	if(process.argv[2] === '-test') {
		runTest()
		.then(() => {
			process.exit();
		});
	} else {
		const cli = require('./cli/index');
		cli.registerCmd('start', (callback) => {
			runTest()
			.then(() => {
				console.log('==============================================================================');
				console.log('Test Complete');
				console.log('==============================================================================');
				callback();
			});
		});
		cli.printMenu();
		cli.start();
	}
})();