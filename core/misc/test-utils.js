/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/05/06
 */
//
(function() {
	const fs = require('fs');
	const path = require('path');
	const childProcess = require('child_process');
	const exec = childProcess.exec;
	const fork = childProcess.fork;
	const Utils = require('../cli/lib/utils');
	const CLIColor = require('../cli/lib/cli-color');
	const config = require('../../config.json');
	const pathOfTestConfig = path.join(process.cwd(), 'test-config.json');
	const testConfig = {};

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
		var actualArgs = [];
		for(var i in args) {
			var arg = args[i];
			if(typeof arg === 'string' && arg[0] !== '-') {
				arg = '"'+arg+'"';
			}
			actualArgs.push(arg);
		}
		var proc = fork(execCmd, actualArgs, {
			cwd: options.cwd,
			stdio: 'ignore'
		});
		return proc;
	}
	function buildArgumentArray(argsMap) {
		var argArray = [];
		for(var key in argsMap) {
			var value = argsMap[key];
			if(typeof value === 'string') {
				argArray.push('-'+key);
				argArray.push(value);
			}
		}
		return argArray;
	}

	/**/
	function loadTestConfig(workingDirectory) {
		try {
			var loadedTestConfig = require(pathOfTestConfig);
			Utils.clean(testConfig);
			Utils.init(testConfig, loadedTestConfig);
		} catch(err) {
			if(err.code === 'MODULE_NOT_FOUND') {
				testConfig.testNumber = 1;
				saveTestConfig();
			} else {
				console.log(err);
			}
		}
	}
	function saveTestConfig() {
		return new Promise((resolve) => {
			fs.writeFile(pathOfTestConfig, JSON.stringify(testConfig), function() {
				resolve();
			});
		});
	}
	loadTestConfig();
	/**/
	function TestContext(workingDirectory) {
		this.isTestOutputGenerated = false;
		this.isTestLogGenerated = false;
		this.isTestReportGenerated = false;
		this.countOfTotalCriticalTests = 0;
		this.countOfPassedCriticalTests = 0;
		this.countOfFailedCriticalTests = 0;
		this.countOfTotalTests = 0;
		this.countOfPassedTests = 0;
		this.countOfFailedTests = 0;
		this.status = 'FAIL';
		this.isComplete = false;
		this.rpcProc = undefined;
		this.testProc = undefined;
		this.workingDirectory = workingDirectory;
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
	TestContext.prototype.generateTestOutputPath = function() {
		return path.resolve(path.join(this.workingDirectory, 'output', testConfig.testNumber.toString()));
	};
	TestContext.prototype.restoreTestNumber = function() {
		testConfig.testNumber++;
		return saveTestConfig();
	};
	TestContext.prototype.start = function(libPath, testScriptPath, testCaseName, includeTags, excludeTags) {
		var testContext = this;
		testContext.libPath = libPath;
		testContext.testScriptPath = testScriptPath;
		testContext.testCaseName = testCaseName;
		testContext.includeTags = includeTags;
		testContext.excludeTags = excludeTags;
		var workingDirectory = testContext.workingDirectory;
		return new Promise((resolve) => {
			var absLibPath = path.isAbsolute(libPath) ? libPath : path.resolve(path.join(workingDirectory, libPath));
			var args = {
				lib: absLibPath,
				t: testCaseName,
				i: includeTags,
				e: excludeTags
			};
			var argArray = buildArgumentArray(args);
			testContext.rpcProc = forkProcess(path.join(__dirname, '../lib.js'), argArray, {
				cwd: workingDirectory
			});
			var testOutputPath = testContext.generateTestOutputPath();
			testContext.testProc = runProcess('pybot -d '+testOutputPath+' '+testScriptPath, {
				cwd: workingDirectory,
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
					} else if((args = /(\d+)\scritical test.?,\s(\d+)\spassed,\s(\d+)\sfailed/.exec(data))) {
						var testResultArray = data.split('\n');
						testContext.countOfTotalCriticalTests = parseInt(args[1]);
						testContext.countOfPassedCriticalTests = parseInt(args[2]);
						testContext.countOfFailedCriticalTests = parseInt(args[3]);
						if(testResultArray.length >= 2) {
							if((args = /(\d+)\stest.? total,\s(\d+)\spassed,\s(\d+)\sfailed/.exec(testResultArray[1]))) {
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

					testContext.restoreTestNumber()
					.then(() => {
						resolve(testContext);
					});
				}
			});
		});
	};
	TestContext.prototype.toJson = function() {
		return {
			status: this.status,
			countOfTotalTests: this.countOfTotalTests,
			countOfPassedTests: this.countOfPassedTests,
			countOfFailedTests: this.countOfFailedTests
		};
	};
	function TestRunner(workingDirectory) {
		this.workingDirectory = workingDirectory;
		this.jobId = 0;
		this.jobOrders = [];
		this.jobs = {};
		this.jobPromise;
	}
	TestRunner.prototype.generateJobId = function() {
		var newJobId = this.jobId;
		this.jobId++;
		return newJobId;
	};
	TestRunner.prototype.run = function(libPath, testScriptPath, testCaseName, includeTags, excludeTags) {
		var testRunner = this;
		var jobId = testRunner.generateJobId();
		testRunner.jobOrders.push(jobId);
		testRunner.jobs[jobId] = {
			args: [libPath, testScriptPath, testCaseName, includeTags, excludeTags]
		};
		var errors = [];
		var jobContexts = [];
		function executeJobs(callback, doneCallback) {
			var startTime = new Date().getTime();
			var currentJobId = testRunner.jobOrders[0];
			if(typeof currentJobId === 'undefined') {
				if(doneCallback) {
					doneCallback(errors, jobContexts);
				}
			} else {
				var jobContext = testRunner.jobs[currentJobId];
				var newTestContext = new TestContext(testRunner.workingDirectory);
				return newTestContext.start.apply(newTestContext, jobContext.args)
				.then((result) => {
					testRunner.jobOrders.splice(0, 1);
					delete testRunner.jobs[currentJobId];
					var elapsedTime = (new Date().getTime() - startTime) / 1000 + ' sec(s)';
					console.log('==============================================================================');
					console.log(`Total: ${result.countOfTotalTests}`);
					console.log(`Pass: ${result.countOfPassedTests}`);
					console.log(`Fail: ${result.countOfFailedTests}`);
					var status = result.status === 'Pass' ? result.status.clrLightGreen() : result.status.clrLightRed();
					console.log(`Result: ${status}`);
					console.log(`Elapsed Time: ${elapsedTime}`);
					console.log('==============================================================================');
					jobContexts.push(newTestContext.toJson());
					executeJobs(callback, doneCallback);
				}, (err) => {
					console.log();
					process.stdout.write(err.message.clrLightRed()+'\n>');
					errors.push(err);
					callback(null, jobContext);
				});
			}
		}
		if(testRunner.jobPromise) {
			return testRunner.jobPromise;
		} else {
			testRunner.jobPromise = new Promise((resolve, reject) => {
				executeJobs(() => {
					delete testRunner.jobPromise;
				}, (errors, context) => {
					if(errors && errors.length) {
						reject(errors);
					} else {
						resolve(context);
					}
				});
			});
			return testRunner.jobPromise;
		}
	}

	module.exports = {
		createTestRunner: function(workingDirectory) {
			return new TestRunner(workingDirectory);
		},
		forkProcess: forkProcess
	};
})();