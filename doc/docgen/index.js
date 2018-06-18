const Showdown = require('showdown');
const assert = require('assert');

const { createAutodoc } = require('./autodoc');
const doc = require('../doc');

const BLOCK = /(?:\n\n|^)\.\.(.*(?:\n    .*)*)/;
// TODO: allow braces here
const ARG_RAW = '[A-Za-z][A-Za-z0-9]*(?:[#.][A-Za-z][A-Za-z0-9]*)*';
const ARG_QUOTE = (quote) => `${quote}(?:[^${quote}\\\\]|\\\\${quote})*?${quote}`;
const ARGUMENTS = new RegExp('(?:' + ARG_RAW + ')|(?:' + ARG_QUOTE('"') + ')|(?:' + ARG_QUOTE("'") + ')', 'g');

function findInDocJSON(ident) {
    const identParts = splitIdentParts(ident);
    let subDoc = doc;

    while(identParts.length) {
        if (!subDoc) return subDoc;

        const identifier = identParts.shift();
        const child = subDoc.children.filter(c => c.flags.isExported && normaliseStrings(c.name) === identifier);
        subDoc = child[0];
    }

    return subDoc;
}

function normaliseStrings(str) {
    if (str.startsWith('"')) {
        return str.slice(1, -1).replace(/\\"/, '"');
    } else if (str.startsWith("'")) {
        return str.slice(1, -1).replace(/\\'/, "'");
    } else {
        return str;
    }
}

function splitIdentParts(identString) {
    return identString.split(/[#.]/);
}

function parseBlock(block) {
    const lines = block.split('\n');

    const arguments = lines[0].match(ARGUMENTS).map(normaliseStrings);
    const directive = arguments[0];

    const options = {};

    for (const line of lines.slice(1)) {
        const [key, value] = line.split('=');
        options[key.trim()] = value.trim();
    }

    return {
        directive, options,
        arguments: arguments.slice(1),
    }
}

const rstify = () => [{
    type: 'lang',
    filter(text, converter, options) {
        while (true) {
            const blockString = BLOCK.exec(text);
            if (!blockString) break;

            const block = parseBlock(blockString[1]);
            assert(block.directive === 'autodoc');
            const blockDoc = findInDocJSON(block.arguments[0]);

            if (!blockDoc) throw new Error('invalid autodoc:', );

            text = text.slice(0, blockString.index)
                + createAutodoc(block, blockDoc)
                + text.slice(blockString[0].length + blockString.index);
        }

        return text;
    }
}];

const converter = new Showdown.Converter({ extensions: [rstify] });
console.log(converter.makeHtml(`
# Hello

..autodoc polyfills

..autodoc types
    noheader=true

..autodoc 'checker'

..autodoc evaluator

..autodoc "parser#parse"
    option=true
    otherOption=false

Here I can reference ..[parser#parse][] or ..[the parsing function][parser#parse]
`));
