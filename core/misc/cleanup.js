/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/05/05
 */
//
(function() {
	const path = require('path');
	const fs = require('fs');

	function rmIfExists(fPath) {
		return new Promise((resolve) => {
			fs.stat(fPath, (err, data) => {
				if(data) {
					if(data.isFile()) {
						rmFileIfExists(fPath)
						.then(resolve);
					} else {
						return new Promise((resolve) => {
							fs.readdir(fPath, (err, files) => {
								if(files) {
									Promise.all(files.map((fileName) => {
										var currentPath = path.join(fPath, fileName);
										return rmIfExists(currentPath);
									}))
									.then(resolve);
								} else {
									resolve();
								}
							})
						})
						.then(() => {
							fs.rmdir(fPath, () => {
								resolve();
							});
						});
					}
				} else {
					resolve();
				}
			})
		});
	}
	function rmFileIfExists(fPath) {
		return new Promise((resolve) => {
			fs.unlink(fPath, () => {
				resolve();
			});
		});
	}

	rmIfExists(path.join(__dirname, '../../log.html'))
	.then(() => {
		return rmIfExists(path.join(__dirname, '../../output.xml'))
	})
	.then(() => {
		return rmIfExists(path.join(__dirname, '../../report.html'))
	})
	.then(() => {
		return rmIfExists(path.join(__dirname, '../../output'))
	})
	.then(() => {
		console.log('done!');
	});
})();