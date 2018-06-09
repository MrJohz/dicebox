import { createLanguage, alt, string, regexp, seq, oneOf, optWhitespace, of } from 'parsimmon';

import { EDice, dice, number, binExpression, funcExpression } from './types';

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

const operatorLow = oneOf('+-%').desc('+ or - or %');
const operatorMed = oneOf('*/').desc('* or /');
const operatorHigh = string('**').desc('**');

const openBracket = string('(').desc('open paren');
const closeBracket = string(')').desc('close paren');
const functionName = alt(
    string('floor'),
    string('round'),
    string('ciel'),
    string('abs'),
);

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
    Expr: r => r.ExprLow.trim(optWhitespace),

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

    ExprHigh: r => seq(r.LiteralOrExpr, seq(operatorHigh.trim(optWhitespace), r.LiteralOrExpr).many())
        .map(([head, tail]) => [head, ...tail])
        .map(factors => factors.reduce((prev, curr) => !prev ? curr : binExpression({
            op: curr[0],
            lhs: prev,
            rhs: curr[1],
        }))),

    LiteralOrExpr: r => alt(r.ExprFunction, r.Literal, r.ExprBracketed),

    ExprFunction: r => seq(functionName, openBracket.skip(optWhitespace), r.Expr, closeBracket.trim(optWhitespace))
        .map(([func, _, arg]) => funcExpression({ func, arg })),

    ExprBracketed: r => seq(openBracket.skip(optWhitespace), r.Expr, optWhitespace.then(closeBracket))
        .map(([_, expr]) => expr),

    Literal: r => alt(r.Dice, r.Number),

    Dice: r => seq(
        alt(
            r.ExprBracketed,
            AnyDigits.map(intOf),
            of(1),
        ),
        DiceSpec,
        alt(
            r.ExprBracketed,
            DigitsNotZero.map(diceSidesOf),
            FateDice.map(diceSidesOf),
        ),
    ).map(([noDice, _, diceSides]) => dice({ noDice, diceSides })),

    Number: () => AnyNum.map(floatOf).map(value => number({ value })),
});

export function parse(s: string): EDice {
    return language.Expr.tryParse(s);
}
