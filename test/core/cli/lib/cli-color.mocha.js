/*
    Author: Samick.Hsu(boneache@gmail.com)
    */
//
(function() {

	const path = require('path');
	const assert = require('assert');

	const appFolder = path.join(__dirname, '../../../../');
	function requireAppModule(modulepath) { return require(path.join(appFolder, modulepath)); }
	const testCaseName = path.basename(__filename).replace('.mocha'+path.extname(__filename), '');
	const CLIColor = requireAppModule('core/cli/lib/cli-color');

	describe(testCaseName, function() {

		it('toColorCode', function(done) {
			assert.equal('\033[redm', CLIColor.toColorCode('red'));
			assert.equal('\033[m', CLIColor.toColorCode(''));
			assert.equal('\033[abcm', CLIColor.toColorCode('abc'));
			assert.equal('\033[testm', CLIColor.toColorCode('test'));
			done();
		});

		it('toColoredText', function(done) {
			assert.equal('\u001b[0;30mtest\u001b[0m', CLIColor.toColoredText('test', 'Black'));
			assert.equal('\u001b[0;31mtest\u001b[0m', CLIColor.toColoredText('test', 'Red'));
			assert.equal('\u001b[0;32mtest\u001b[0m', CLIColor.toColoredText('test', 'Green'));
			assert.equal('\u001b[0;33mtest\u001b[0m', CLIColor.toColoredText('test', 'Brown'));
			assert.equal('\u001b[0;34mtest\u001b[0m', CLIColor.toColoredText('test', 'Blue'));
			assert.equal('\u001b[0;35mtest\u001b[0m', CLIColor.toColoredText('test', 'Purple'));
			assert.equal('\u001b[0;36mtest\u001b[0m', CLIColor.toColoredText('test', 'Cyan'));
			assert.equal('\u001b[0;37mtest\u001b[0m', CLIColor.toColoredText('test', 'LightGray'));
			assert.equal('\u001b[1;30mtest\u001b[0m', CLIColor.toColoredText('test', 'DarkGray'));
			assert.equal('\u001b[1;31mtest\u001b[0m', CLIColor.toColoredText('test', 'LightRed'));
			assert.equal('\u001b[1;32mtest\u001b[0m', CLIColor.toColoredText('test', 'LightGreen'));
			assert.equal('\u001b[1;33mtest\u001b[0m', CLIColor.toColoredText('test', 'Yellow'));
			assert.equal('\u001b[1;34mtest\u001b[0m', CLIColor.toColoredText('test', 'LightBlue'));
			assert.equal('\u001b[1;35mtest\u001b[0m', CLIColor.toColoredText('test', 'LightPurple'));
			assert.equal('\u001b[1;36mtest\u001b[0m', CLIColor.toColoredText('test', 'LightCyan'));
			assert.equal('\u001b[1;37mtest\u001b[0m', CLIColor.toColoredText('test', 'White'));
			assert.equal('\u001b[0mtest\u001b[0m', CLIColor.toColoredText('test', 'NoColor'));
			done();
		});

		it('clr color', function(done) {
			assert.equal('\u001b[0;30mtest\u001b[0m', 'test'.clrBlack());
			assert.equal('\u001b[0;31mtest\u001b[0m', 'test'.clrRed());
			assert.equal('\u001b[0;32mtest\u001b[0m', 'test'.clrGreen());
			assert.equal('\u001b[0;33mtest\u001b[0m', 'test'.clrBrown());
			assert.equal('\u001b[0;34mtest\u001b[0m', 'test'.clrBlue());
			assert.equal('\u001b[0;35mtest\u001b[0m', 'test'.clrPurple());
			assert.equal('\u001b[0;36mtest\u001b[0m', 'test'.clrCyan());
			assert.equal('\u001b[0;37mtest\u001b[0m', 'test'.clrLightGray());
			assert.equal('\u001b[1;30mtest\u001b[0m', 'test'.clrDarkGray());
			assert.equal('\u001b[1;31mtest\u001b[0m', 'test'.clrLightRed());
			assert.equal('\u001b[1;32mtest\u001b[0m', 'test'.clrLightGreen());
			assert.equal('\u001b[1;33mtest\u001b[0m', 'test'.clrYellow());
			assert.equal('\u001b[1;34mtest\u001b[0m', 'test'.clrLightBlue());
			assert.equal('\u001b[1;35mtest\u001b[0m', 'test'.clrLightPurple());
			assert.equal('\u001b[1;36mtest\u001b[0m', 'test'.clrLightCyan());
			assert.equal('\u001b[1;37mtest\u001b[0m', 'test'.clrWhite());
			assert.equal('\u001b[0mtest\u001b[0m', 'test'.clrNoColor());
			done();
		});

	});
})();