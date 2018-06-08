import { createLanguage, alt, string, regexp, seq, optWhitespace } from 'parsimmon';

import { Dice, dice } from './types';

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

const language = createLanguage({
    Expr: r =>
        seq(
            r.Factor,
            optWhitespace,
            alt(string('+'), string('-')),
            optWhitespace,
            r.Factor,
        ).or(r.Factor)
            .map(val => console.log(val) || val),
    Factor: r => r.Dice,
    Dice: r =>
        seq(
            alt(r.AnyNum).fallback('1').map(i => parseInt(i, 10)),
            string('d'),
            alt(
                r.NumNot0.map(i => parseInt(i, 10)),
                string('F'),
            ).map(diceOf),
        ).map(([noDice, _, diceSides]) => dice({ noDice, diceSides })),
    AnyNum: r => alt(string('0'), r.NumNot0).desc('number'),
    NumNot0: () => regexp(/[1-9]+/).desc('non-zero number'),
});

export function parse(s: string): Dice {
    return language.Expr.tryParse(s);
}
