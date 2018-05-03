/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2017/08/31
 */
//
(function() {

	const clipboardy = require('clipboardy');

	function getClipboardText() {
		return clipboardy.readSync();
	}

	module.exports = {
		getClipboardText: getClipboardText
	};
})();