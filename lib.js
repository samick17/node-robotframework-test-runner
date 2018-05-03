/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/03/03
 */
//
(function() {
	const fs = require('fs');
	const util = require('util');
	const assert = require('assert');
	/*
	this.output.[
	'trace', 'info', 'debug', 'warn', 'html'
	]
	*/
	module.exports = [{
		name: 'countItemsInDirectory',
		fn: function (path) {
			return fs.readdirSync(path).length;
		},
		doc: 'Returns the number of items in the directory specified by `path`.'
	}, {
		name: 'asyncCall1',
		fn: function () {
			var lib = this;
			return new Promise((resolve, reject) => {
				lib.output.info('start async call');
				lib.output.info(Object.keys(lib));
				setTimeout(function() {
					lib.output.info('async call complete');
					resolve();
				}, 500);
			});
		},
		doc: 'Returns the number of items in the directory specified by `path`.'
	}, {
		name: 'doSomething',
		fn: function() {
			console.log('doSomething....');
		}
	}, {
		name: 'assertEqual',
		fn: function (expected, actual) {
			this.output.info('typeof expected: ' + typeof expected);
			assert.deepEqual(expected, actual, util.format('expected: %s, actual: %s', expected, actual));
		}
	}];
})();