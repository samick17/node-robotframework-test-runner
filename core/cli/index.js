/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/03/18
 */
//
(function() {

	const io = require('./lib/read-write');

	var commandHandlers = {
		help: function() {
			Object.keys(commandHandlers).forEach((cmd, index) => {
				console.log(`${index+1}. ${cmd}`);
			});
		}
	};
	var autoCompleteCollection = Object.keys(commandHandlers);

	function start() {
		io.setAutoCompleteCollection(autoCompleteCollection);
		io.start()
		.then(() => {
			io.read('>', (text, callback) => {
				var textArray = text.split(' ');
				cmd = textArray[0];
				if(cmd in commandHandlers) {
					commandHandlers[cmd](textArray.slice(1), callback);
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