import { compile } from 'moo';

export const lexer = compile({
    dice: 'd',
    num0: { match: /0/ },
    numNot0: /[1-9][0-9]*/,
    numFate: 'F',
});
