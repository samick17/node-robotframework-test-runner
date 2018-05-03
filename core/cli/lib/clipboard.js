/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2017/08/31
 */
//
(function() {
	const Promise = require('bluebird');
	var spawn = require('child_process').spawn;
	var osPlatform = require('os').platform();
	function getWin32ClipboardText() {
		var chunk = '';
		var errChunk = '';
		return new Promise((resolve, reject) => {
			child = spawn('powershell.exe',['& {Add-Type -AssemblyName System.Windows.Forms; $tb = New-Object System.Windows.Forms.TextBox; $tb.Multiline = $true; $tb.Paste(); $tb.Text;}']);
			child.stdout.on('data', function(data) {
				chunk += data;
			});
			child.stderr.on('data', function(data) {
				errChunk += data;
			});
			child.on('exit', function(){
				if(errChunk) {
					reject(errChunk);
				} else {
					resolve(chunk);
				}
			});
			child.stdin.end();
		});
	}
	function getLinuxClipboardText() {
		return new Promise((resolve, reject) => {
			resolve('');
		});
	}
	function getDefaultClipboardText() {
		return new Promise((resolve, reject) => {
			resolve('');
		});
	}

	var getClipboardText = (function() {
		switch(osPlatform) {
			case 'win32':
			return getWin32ClipboardText;
			case 'linux':
			return getLinuxClipboardText;
			default:
			return getDefaultClipboardText;
		}
	})();
	
	module.exports = {
		getClipboardText: getClipboardText
	};
})();