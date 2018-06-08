import { createLanguage, alt, string, regexp, seq, oneOf, optWhitespace } from 'parsimmon';

import { EDice, dice, number, binExpression } from './types';

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

const operatorLow = oneOf('+-').desc('+ or -');
const operatorMed = oneOf('*/').desc('* or /');
const operatorHigh = string('**').desc('**');

const AnyFloat = seq(
    AnyDigits.fallback('0'),
    string('.'),
    AnyDigits,
    seq(
        oneOf('eE').desc('e/E'),
        AnyDigits,
    ).desc('exponent').map(all => all.join('')).fallback(''),
).map(all => all.join('')).desc('float');

const AnyInt = seq(
    AnyDigits,
    seq(
        oneOf('eE').desc('e/E'),
        AnyDigits,
    ).desc('exponent').map(all => all.join('')).fallback(''),
).map(all => all.join('')).desc('integer w/ exponent');

const AnyNum = alt(AnyFloat, AnyInt).desc('number');

const language = createLanguage({
    Expr: r => r.ExprLow,

    ExprLow: r => seq(r.ExprMed, seq(operatorLow.trim(optWhitespace), r.ExprMed).many())
        .map(([head, tail]) => [head, ...tail])
        .map(factors => factors.reduce((prev, curr) => !prev ? curr : binExpression({
            op: curr[0],
            lhs: prev,
            rhs: curr[1],
        }))),

    ExprMed: r => seq(r.ExprHigh, seq(operatorMed.trim(optWhitespace), r.ExprHigh).many())
        .map(([head, tail]) => [head, ...tail])
        .map(factors => factors.reduce((prev, curr) => !prev ? curr : binExpression({
            op: curr[0],
            lhs: prev,
            rhs: curr[1],
        }))),

    ExprHigh: r => seq(r.DiceOrNum, seq(operatorHigh.trim(optWhitespace), r.DiceOrNum).many())
        .map(([head, tail]) => [head, ...tail])
        .map(factors => factors.reduce((prev, curr) => !prev ? curr : binExpression({
            op: curr[0],
            lhs: prev,
            rhs: curr[1],
        }))),

    DiceOrNum: r => alt(r.Dice, r.Number),

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
