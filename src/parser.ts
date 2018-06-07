import { Token } from 'moo';
import { lexer } from './lexer';
import { Dice } from './types';

const enum State {
    START,

    // constructing a dice object
    DICE_INITIAL_NUM,
    DICE_CHAR,
    DICE_FINAL_NUM,

}

function diceOf(n: number | 'F') {
    if (n === 'F') {
        return [-1, 0, 1];
    }

    const arr = [];
    for (let i = 1; i <= n; i++) {
        arr.push(i);
    }

    return arr;
}

function createError(token: Token, expected: string[], hint?: string): Error {
    const message = expected.length > 1 ? `expected one of (${expected.join(', ')})` : `expected ${expected[0]}`;
    const messageWithHint = hint ? `${message} -- ${hint}` : message;
    if (token.type === 'eof') {
        throw new Error(`Unexpected end of input: ${messageWithHint}`);
    }
    return new Error(lexer.formatError(token, messageWithHint));
}

class Parser {

    private state = State.START;
    private dice = {} as Dice;
    private token!: Token;

    next() {
        let token = lexer.next();
        if (token === undefined) {
            return { type: 'eof' } as Token;
        } else {
            return token;
        }
    }

    parse(input: string): Dice {
        lexer.reset(input);
        this.token = this.next();

        return this.parseDice();
    }

    parseDice(): Dice {
        let noDice = 1;
        if (this.token.type === 'num0' || this.token.type === 'numNot0') {
            noDice = parseInt(this.token.value);
            this.token = this.next();
        }

        if (this.token.type !== 'dice') {
            throw createError(this.token, [`'d'`]);
        } else {
            this.token = this.next();
        }

        let diceSides;

        if (this.token.type === 'num0') {
            throw createError(this.token, [`'F'`, `number`], 'a dice may not have 0 sides');
        } else if (this.token.type === 'numFate') {
            diceSides = diceOf('F');
        } else if (this.token.type === 'numNot0') {
            diceSides = diceOf(parseInt(this.token.value, 10));
        } else {
            throw createError(this.token, [`'F'`, 'number']);
        }

        return { noDice, diceSides };
    }

}

export function parse(s: string): Dice {
    return new Parser().parse(s);
}

// export function parse(s: string): Dice {
//     lexer.reset(s);
//
//     let state = State.START;
//     let dice = {} as Dice;
//
//     while (true) {
//         let token = lexer.next();
//         if (token === undefined) {
//             token = { type: 'eof' } as Token;
//         }
//
//         SWITCH_START:
//             switch (state) {
//                 case State.START:
//                     switch (token.type) {
//                         case 'num0':
//                         case 'numNot0':
//                             state = State.DICE_INITIAL_NUM;
//                             dice.noDice = parseInt(token.value, 10);
//                             break SWITCH_START;
//                         case 'dice':
//                             state = State.DICE_CHAR;
//                             dice.noDice = 1;
//                             break SWITCH_START;
//                         default:
//                             createError(token, ['number', 'd']);
//                     }
//                 case State.DICE_INITIAL_NUM:
//                     switch (token.type) {
//                         case 'dice':
//                             state = State.DICE_CHAR;
//                             break SWITCH_START;
//                         default:
//                             createError(token, [`'d'`]);
//                     }
//                 case State.DICE_CHAR:
//                     switch (token.type) {
//                         case 'numNot0':
//                             state = State.DICE_FINAL_NUM;
//                             dice.diceSides = diceOf(parseInt(token.value, 10));
//                             break SWITCH_START;
//                         case 'numFate':
//                             state = State.DICE_FINAL_NUM;
//                             dice.diceSides = diceOf('F');
//                             break SWITCH_START;
//                         case 'num0':
//                             createError(token, ['number', `'F'`], 'number must be non-zero');
//                         default:
//                             createError(token, ['number', `'F'`]);
//                     }
//                 case State.DICE_FINAL_NUM:
//                     switch (token.type) {
//                         case 'eof':
//                             return dice;
//                     }
//             }
//
//     }
// }
