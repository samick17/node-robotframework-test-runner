/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/03/18
 */
//
(function() {

	const io = require('./lib/read-write');
	const CLIColor = require('./lib/cli-color');
	const Utils = require('./lib/utils');

	const commandHandlers = {
		help: function() {
			Object.keys(commandHandlers).forEach((cmd, index) => {
				console.log(`${index+1}. ${cmd}`);
			});
		}
	};
	const autoCompleteCollection = Object.keys(commandHandlers);

	function start() {
		io.setAutoCompleteCollection(autoCompleteCollection);
		io.start()
		.then(() => {
			io.read('>', (text, callback) => {
				var textArray = text.split(' ');
				cmd = textArray[0];
				if(cmd in commandHandlers) {
					var handler = commandHandlers[cmd];
					if(typeof handler === 'function') {
						handler(textArray.slice(1), callback);
					} else {
						var args = textArray.slice(1);
						if(handler.args) {
							var argsMap = Utils.parseArgsFromText(args.join(' '));
							var lackOfArgsArray = [];
							for(var key in handler.args) {
								var argDef = handler.args[key];
								if(argDef.required && !(key in argsMap)) {
									lackOfArgsArray.push({
										key: key,
										arg: argDef
									});
								}
							}
							if(lackOfArgsArray.length) {
								var sampleCommandArgs = [];
								for(var key in handler.args) {
									var argDef = handler.args[key];
									sampleCommandArgs.push('-{0} "{1}"'.format(key, argDef.sample || ''));
								}
								var message = 'Invalid arguments'.clrLightRed();
								var sampleCommand = 'hint: {0} {1}'.format(cmd, sampleCommandArgs.join(' ')).clrLightCyan();
								console.log(message);
								process.stdout.write(sampleCommand+'\n>');
								callback();
							} else {
								handler.fn(argsMap, callback);
							}
						} else {
							handler.fn(textArray.slice(1), callback);
						}
					}
				}
			});
		});
	}
	function registerCmd(key, handler) {
		if(key in commandHandlers) {
			throw new Error(`command: '${key}' already registered!`);
		} else {
			commandHandlers[key] = handler;
			autoCompleteCollection.push(key);
		}
	}
	function printMenu() {
		console.log(
			[
			'+------------------------------------------------------------------+',
			`     Node Robotframework Runner Ver: ${process.env.npm_package_version}     `,
			'                                      ',
			'     Author: Samick.Hsu <boneache@gmail.com>        ',
			'+------------------------------------------------------------------+',
			].join('\n'));
		console.log('[Commands]');
		commandHandlers.help();
		console.log('--------------------------------------------------------------------');
	}

	module.exports = {
		printMenu: printMenu,
		start: start,
		registerCmd: registerCmd,
		CLIColor: require('./lib/cli-color')
	};
})();