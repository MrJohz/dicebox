import { createLanguage, alt, string, regexp, seq, oneOf } from 'parsimmon';

import { EDice, dice, number } from './types';

function diceSidesOf(n: string) {
    if (n === 'F') {
        return [-1, 0, 1];
    }

    const arr = [];
    const all = parseInt(n, 10);
    for (let i = 1; i <= all; i++) {
        arr.push(i);
    }

    return arr;
}

function intOf(n: string): number {
    return parseInt(n, 10);
}

function floatOf(n: string): number {
    return parseFloat(n);
}

const DigitsNotZero = regexp(/[1-9]+/).desc('non-zero integer');
const AnyDigits = alt(string('0'), DigitsNotZero).desc('integer');
const FateDice = string('F').desc(`fate dice 'F'`);
const DiceSpec = string('d').desc(`dice specifier 'd'`);

const AnyFloat = seq(
    AnyDigits.fallback('0'),
    string('.'),
    AnyDigits,
    seq(
        oneOf('eE'),
        AnyDigits,
    ).map(all => all.join('')).fallback(''),
).map(all => all.join(''));

const AnyInt = seq(
    AnyDigits,
    seq(
        oneOf('eE'),
        AnyDigits,
    ).map(all => all.join('')).fallback(''),
).map(all => all.join(''));

const AnyNum = alt(AnyFloat, AnyInt);

const language = createLanguage({
    Expr: r => r.Factor,

    Factor: r => alt(r.Dice, r.Number),

    Dice: () => seq(
        AnyDigits.fallback('1').map(intOf),
        DiceSpec,
        alt(
            DigitsNotZero,
            FateDice,
        ).map(diceSidesOf),
    ).map(([noDice, _, diceSides]) => dice({ noDice, diceSides })),

    Number: () => AnyNum.map(floatOf).map(value => number({ value })),
});

export function parse(s: string): EDice {
    return language.Expr.tryParse(s);
}
