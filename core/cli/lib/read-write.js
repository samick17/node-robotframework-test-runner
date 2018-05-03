/*
 * @Author: Samick.Hsu
 * @CreatedDate: 2017/08/12
 */
//
(function() {
  const Promise = require('bluebird');
  const os = require('os');
  const Clipboard = require('./clipboard');
  const Utils = require('./utils');
  var autoCompleteCollection = [];
  var chunk = '';
  var isStarted = false;
  var promptText = '';
  var handler = function() {};
  var isMuted = false;
  const KeyEventHandlers = {};
  const commandHistory = [];
  const MaxLengthOfHistoryCommands = 50;
  var commandHistoryIndex = -1;

  const KeyCodes = {
    CtrlC: '3',
    CtrlV: '22',
    Backspace: '8',
    Tab: '9',
    Enter: '13',
    Esc: '27',
    Home: '279149126',
    End: '279152126',
    UpArrow: '279165',
    DownArrow: '279166',
    LeftArrow: '279168',
    RightArrow: '279167',
    Insert: '279150126',
    Del: '279151126',
    PageUp: '279153126',
    PageDown: '279154126',
    F1: '27919165',
    F2: '27919166',
    F3: '27919167',
    F4: '27919168',
    F5: '27919169',
    F6: '27914955126',
    F7: '27914956126',
    F8: '27914957126',
    F9: '27915048126',
    F10: '27915049126',
    F11: '27915051126',
    F12: '27915052126'
  };

  const StringComparator = (function() {
    function similarity(s1, s2) {
      var longer = s1;
      var shorter = s2;
      if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
      }
      var longerLength = longer.length;
      if (longerLength == 0) {
        return 1.0;
      }
      return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
    }
    function editDistance(s1, s2) {
      s1 = s1.toLowerCase();
      s2 = s2.toLowerCase();

      var costs = new Array();
      for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
          if (i == 0)
            costs[j] = j;
          else {
            if (j > 0) {
              var newValue = costs[j - 1];
              if (s1.charAt(i - 1) != s2.charAt(j - 1))
                newValue = Math.min(Math.min(newValue, lastValue),
                  costs[j]) + 1;
              costs[j - 1] = lastValue;
              lastValue = newValue;
            }
          }
        }
        if (i > 0)
          costs[s2.length] = lastValue;
      }
      return costs[s2.length];
    }
    return {
      compare: function(text1, text2) {
        return similarity(text1, text2);
      }
    };
  })();
  function prompt() {
    process.stdout.write(promptText + chunk);
  }
  function suggestion(text) {
    var result = [];
    autoCompleteCollection.forEach((autoCompleteText) => {
      if(autoCompleteText.indexOf(text) === 0) {
        result.push(autoCompleteText);
      }
    });
    return result;
  }
  function listSuggestedText() {
    if(chunk) {
      var suggestedTextArray = suggestion(chunk);
      var lenOfSuggested = suggestedTextArray.length;
      switch(lenOfSuggested) {
        case 0:
        break;
        case 1:
        printMessage(suggestedTextArray[0].substring(chunk.length));
        chunk = suggestedTextArray[0];
        break;
        default:
        console.log();
        console.log(suggestedTextArray.join('\n'));
        prompt();
        break;
      }
    }
  }
  function pushHistory(chunkText) {
    if(chunkText && commandHistory[commandHistory.length-1] !== chunkText) {
      if(commandHistory.length > MaxLengthOfHistoryCommands) {
        commandHistory.splice(0, 1);
      }
      commandHistory.push(chunkText);
      commandHistoryIndex = commandHistory.length;
    }
  }
  function listHistory() {
    console.log('---------------- History ----------------');
    var commandHistoryDigitsLen = commandHistory.length.toString().length;
    commandHistory.forEach((cmd, index) => {
      var indexText = Utils.zfill(index+1, ' ', commandHistoryDigitsLen);
      console.log(` ${indexText} ${cmd}`);
    });
    console.log('------------- End of history -------------');
  }
  function cls() {
    process.stdout.write('\x1Bc');
  }
  function createReadPrompHandler(io, message, resolve, reject, callback) {
    promptText = message;
    handler = function() {
      var chunkText = chunk;
      var chunTextArray = chunkText.split(os.EOL);
      if(chunTextArray.length > 1) {
        chunTextArray.splice(chunTextArray.length-1, 1);
        var chunkIndex = 0;
        function handleMultiCmd() {
          if(chunkIndex < chunTextArray.length) {
            var cmdText = chunTextArray[chunkIndex];
            callback(cmdText, function() {
              chunkIndex++;
              pushHistory(cmdText);
              handleMultiCmd();
            });
          } else {
            callback(null, function() {});
          }
        }
        handleMultiCmd();
        chunk = '';
      } else {
        pushHistory(chunTextArray[0]);
        callback(chunTextArray[0], function() {

        });
      }
      chunk = '';
      resolve();
      prompt();
      return io;
    };
  }
  function dataToCharCode(data) {
    var dataBuffer = Buffer.from(data);
    var charCode = '';
    for(var i = 0; i < dataBuffer.length; i++) {
      charCode += dataBuffer[i].toString();
    }
    return charCode;
  }
  function registerKeyEventHandler(key, handler) {
    if(key in KeyCodes) {
      KeyEventHandlers[KeyCodes[key]] = handler;
    } else {
      console.log('register ' + key + ' failed!');
    }
  }
  function autoCompleteWithHistory(nextIndexOffset) {
    var lenOfCommandHistory = commandHistory.length;
    if(lenOfCommandHistory) {
      var nextIndex = commandHistoryIndex + nextIndexOffset;
      if(nextIndex < 0) {
        commandHistoryIndex = 0;
      } else if(nextIndex > lenOfCommandHistory - 1) {
        commandHistoryIndex = lenOfCommandHistory - 1;
      } else {
        commandHistoryIndex = nextIndex;
      }
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      chunk = commandHistory[commandHistoryIndex];
      prompt();
    }
  }
  registerKeyEventHandler('CtrlC', () => {
    process.exit();
  });
  registerKeyEventHandler('CtrlV', () => {
    var text = Clipboard.getClipboardText();
    chunk += text;
    printMessage(text);
    handler();
  });
  registerKeyEventHandler('UpArrow', () => {
    autoCompleteWithHistory(-1);
  });
  registerKeyEventHandler('DownArrow', () => {
    autoCompleteWithHistory(1);
  });
  registerKeyEventHandler('Backspace', () => {
    if(chunk.length > 0) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      chunk = chunk.substring(0, chunk.length - 1);
      prompt();
    }
  });
  registerKeyEventHandler('Tab', () => {
    listSuggestedText();
  });
  registerKeyEventHandler('Enter', () => {
    handler();
  });
  function dataEvent(data) {
    var charCode = dataToCharCode(data);
    if(charCode in KeyEventHandlers) {
      KeyEventHandlers[charCode]();
    } else {
      var charCodeNo = parseInt(charCode);
      if((charCodeNo >= 32 && charCodeNo <= 126)) {
        chunk += data;
        printMessage(data);
      } else {
        //Do nothing
      }
    }
  }
  function printMessage(msg) {
    if(!isMuted) {
      process.stdout.write(msg);
    }
  }
  function readMessage(io, message, muted, callback) {
    return new Promise((resolve, reject) => {
      if(isStarted) {
        isMuted = muted;
        createReadPrompHandler(io, message, resolve, reject, function(chunkText, done) {
          isMuted = false;
          console.log();
          callback(chunkText, done);
        });
      } else {
        callback(null, done);
        resolve();
        return io;
      }
    });
  }
  module.exports = {
    start: function() {
      var io = this;
      return new Promise((resolve, reject) => {
        if(!isStarted) {
          process.stdin.setRawMode( true );
          process.stdin.setEncoding( 'utf8' );
          process.stdin.on('data', dataEvent);
          isStarted = true;
        }
        resolve();
      });
    },
    close: function() {
      return new Promise((resolve, reject) => {
        if(isStarted) {
          process.stdin.removeListener('data', dataEvent);
          isStarted = false;
          resolve();
        } else {
          resolve();
        }
      });
    },
    read: function(message, callback) {
      var io = this;
      return readMessage(io, message, false, callback);
    },
    setAutoCompleteCollection: function(autoCompleteCol) {
      autoCompleteCollection = autoCompleteCol;
    },
    readSecret: function(message, callback) {
      var io = this;
      return readMessage(io, message, true, callback);
    },
    listHistory: listHistory,
    cls: cls,
    StringComparator: StringComparator,
    getLastCommand: function() {
      if(commandHistory.length >= 2) {
        return commandHistory[commandHistory.length-2];
      }
    },
    getAutoCompleteCollection: function() {
      return autoCompleteCollection;
    }
  };
})();

if(module.id === '.') {
  var api = module.exports;
  api.start()
  .then(() => {
    function read() {
      api.read('>', (ans)=>{
        console.log(ans);
        read();
      });
    }
    read();
  });
}