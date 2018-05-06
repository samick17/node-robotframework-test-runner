/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/01/01
 */
//
(function() {
    function ElementNode(name) {
        this.name = name;
        this.attr = {};
        this.children = [];
    }
    ElementNode.prototype.addAttribute = function(key, value) {
        this.attr[key] = value;
    };
    ElementNode.prototype.appendChild = function(child) {
        this.children.push(child);
        child.setParent(this);
    };
    ElementNode.prototype.setParent = function(parent) {
        this.parent = parent;
    };
    ElementNode.prototype.getParent = function() {
        return this.parent;
    };
    ElementNode.prototype.setValue = function(value) {
        this.text = value;
    };
    ElementNode.prototype.toString = function() {
        var attr = JSON.stringify(this.attr);
        return `${this.name}: ${attr}`;
    };
    ElementNode.prototype.printHierarchy = function(layer) {
        layer = typeof layer === 'undefined' ? 0 : layer + 1;
        for(var i = 0; i < layer*2; i++)
            process.stdout.write(' ');
        console.log(`${this.name}` + (typeof this.text !== 'undefined' ? ': '+this.text : ''));
        this.children.forEach(function(n) {
            n.printHierarchy(layer);
        });
    };

    function parseTextAsNodeList(text, context) {
        context = context || {
            buffer: '',
            innerBuffer: undefined,
            isPending: false,
            lastNode: undefined,
            pivot: undefined
        };
        var buffer = context.buffer;
        var innerBuffer = context.innerBuffer;
        var isPending = context.isPending;
        var lastNode = context.lastNode;
        var pivot = context.pivot;
        function handleElement(testText) {
            var re = /<([a-zA-Z0-9:]+)(.*)>/;
            var attrReG = /\s(.*?)="(.*?)"/g;
            var attrRe = /\s(.*?)="(.*?)"/;
            var reResult = re.exec(testText);
            var name = reResult[1];
            var matchedAttrText = reResult[2].match(attrReG);
            var elNode = new ElementNode(name);
            if(matchedAttrText) {
                matchedAttrText.forEach(function(attrText) {
                    var attrReResult = attrRe.exec(attrText);
                    elNode.addAttribute(attrReResult[1], attrReResult[2]);
                });
            }
            return elNode;
        }
        function handleInlineElement(buf) {
            var node = handleElement(buf);
            if(lastNode) {
                lastNode.appendChild(node);
            }
        }
        function handleEndElement(buf) {
            if(lastNode) {
                lastNode.setValue(innerBuffer);
                lastNode = lastNode.getParent();
            }
        }
        function handleStartElement(buf) {
            var node = handleElement(buf);
            if(!pivot) pivot = node;
            if(lastNode) {
                lastNode.appendChild(node);
            }
            lastNode = node;
        }
        function handle(buf) {
            var inlineElementRegex = /<.+\/>/;
            var endTagRegex = /<\/.+>/;
            var startTagRegex = /<.*[^\/]>/;
            if(inlineElementRegex.test(buf)) {
                handleInlineElement(buf);
            } else if(endTagRegex.test(buf)) {
                handleEndElement(buf);
            } else if(startTagRegex.test(buf)) {
                if(!/<\?.*\?>/.test(buf)) {
                    handleStartElement(buf);
                }
            } else {
                console.log(buf);
            }
        }
        function clearBuffer() {
            buffer = undefined;
            innerBuffer = undefined;
            isPending = false;
        };
        function popupBufferAndHandle() {
            handle(buffer);
            clearBuffer();
        };
        function beginBuffer(c) {
            buffer = c;
            isPending = true;
        }
        function endBuffer(c) {
            buffer += c;
            popupBufferAndHandle();

        }
        function appendBuffer(c) {
            if(isPending) {
                buffer += c;
            } else {
                innerBuffer = typeof innerBuffer === 'undefined' ? c : innerBuffer+c;
            }
        }
        function handleCharacter(c) {
            switch(c) {
                case '<':
                beginBuffer(c);
                break;
                case '>':
                endBuffer(c);
                break;
                default:
                appendBuffer(c);
                break;
            }
        }
        for(var i in text) {
            handleCharacter(text[i]);
        }
        return {
            buffer: buffer,
            innerBuffer: innerBuffer,
            isPending: isPending,
            lastNode: lastNode,
            pivot: pivot
        };
    }
    var util = require('util');
    var EventEmitter = require('events');

    function XmlPipeParser() {
        EventEmitter.call(this);
    }
    util.inherits(XmlPipeParser, EventEmitter);

    XmlPipeParser.prototype.write = function(chunk) {
        var context = parseTextAsNodeList(chunk.toString(), this.context);
        if(!this.rootNode) {
            this.rootNode = context.pivot;
        }
        this.context = context;
        this.emit('parseProgress', chunk);
    };
    XmlPipeParser.prototype.end = function() {
        if(!this.isDone) {
            this.isDone = true;
            this.emit('done', this.rootNode);
        }
    };
    XmlPipeParser.prototype.interrupt = function() {
        if(!this.isInterrupted) {
            this.isInterrupted = true;
            this.emit('error', ['interrupt']);
            this.removeAllListeners('parseProgress');
            this.removeAllListeners('error');
            this.removeAllListeners('done');
        }
    };

    XmlPipeParser.prototype.getElements = function() {
        return [this.rootNode];
    };

    function createBuilder() {
        return new XmlPipeParser();
    }

    var currentModule = (function() {
        try {
            return module ? module.exports : {};
        } catch(err) {
            try {
                return window ? window : {};
            } catch(err) {
                return {};
            }
        }
    })();
    currentModule.parse = parseTextAsNodeList;
    currentModule.createBuilder = createBuilder;
})();