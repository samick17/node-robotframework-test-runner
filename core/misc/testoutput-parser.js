/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/05/06
 */
//
(function() {
	const fs = require('fs');
	const path = require('path');
	const XmlParser = require('./xml-parser');
	function parseFromFile(fPath, name) {
		function parseRobotTime(timeText) {
			var dateStr = timeText.substring(0, 8);
			var timeStr = timeText.substring(8);
			return Date.parse(dateStr.substring(0, 4) + ' ' + dateStr.substring(4, 6) + ' ' + dateStr.substring(6, 8) + timeStr + ' GMT');
		}
		return new Promise((resolve, reject) => {
			fs.readFile(fPath, (err, data) => {
				if(err) {
					reject(err);
				} else {
					try {
						var rootNode = XmlParser.parse(data.toString()).pivot;
						var suiteNode = rootNode.children[0];
						var suiteStatusNode = suiteNode.children[suiteNode.children.length - 1];
						var startTime = parseRobotTime(suiteStatusNode.attr.starttime);
						var endTime = parseRobotTime(suiteStatusNode.attr.endtime);
						var elapsedTime = endTime - startTime;
						var statisticsNode = rootNode.children[1];
						var statistics = {};
						for(var i in statisticsNode.children) {
							var childNode1 = statisticsNode.children[i];
							var childStatistics = statistics[childNode1.name] = {};
							for(var j in childNode1.children) {
								var childNode2 = childNode1.children[j];
								var countOfPass = parseInt(childNode2.attr.pass);
								var countOfFail = parseInt(childNode2.attr.fail);
								childStatistics[childNode2.text] = {
									name: name,
									status: suiteStatusNode.attr.status,
									pass: countOfPass,
									fail: countOfFail,
									total: countOfPass + countOfFail,
									startTime: startTime,
									elapsedTime: elapsedTime
								};
							}
						}
						resolve(statistics);
					} catch(err) {
						reject(err);
					}
				}
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
						fs.readdir(fPath, (err, files) => {
							if(err) {
								reject(err);
							} else {
								var statistics = {};
								var promisis = files.map((folderName) => {
									var outputFolder = path.join(fPath, folderName);
									var basename = path.basename(folderName);
									return new Promise((resolve, reject) => {
										fs.stat(outputFolder, (err, data) => {
											if(data && !data.isFile()) {
												var outputXmlPath = path.join(outputFolder, 'output.xml');
												parseFromFile(outputXmlPath, basename)
												.then((statistic) => {
													statistics[basename] = statistic;
													resolve();
												}, () => {
													resolve();
												});
											} else {
												resolve();
											}
										});
									});
								});
								return Promise.all(promisis)
								.then(() => {
									resolve(statistics);
								}, reject);
							}
						});
					}
				}
			});
		});
	}
	function copyFile(srcPath, destPath) {
		return new Promise((resolve) => {
			var rs = fs.createReadStream(srcPath);
			var ws = fs.createWriteStream(destPath);
			rs.pipe(ws);
			ws.on('close', () => {
				resolve();
			});
		});
	}
	function generateReport(workingDirectory, outputFolder) {
		const pathOfTrendReport = path.join(workingDirectory, outputFolder, 'statistics.js');
		function generateTrendData() {
			return new Promise((resolve, reject) => {
				parse(path.join(workingDirectory, outputFolder))
				.then((trendStatistics) => {
					fs.writeFile(pathOfTrendReport, 'var data = '+JSON.stringify(trendStatistics)+';', () => {
						resolve();
					});
				});
			})
		}
		var filesToCopy = ['jade.min.js', 'jquery.min.js', 'trend.js', 'trend.css', 'trend.html'];
		var srcPath = 'trend-resource';
		var destPath = outputFolder;
		return Promise.all(filesToCopy.map((fileName) => {
			return copyFile(path.join(workingDirectory, srcPath, fileName), path.join(workingDirectory, destPath, fileName));
		}).concat(generateTrendData()));
	}
	/*
	parse('../../output')
	.then((trendStatistics) => {
		console.log(JSON.stringify(trendStatistics, null, '  '));
	});
	*/
	/**/
	//generateReport(path.resolve('../../'), 'output');
	
	module.exports = {
		parse: parse,
		generateReport: generateReport
	};
})();