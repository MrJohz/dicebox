import { alt, createLanguage, of, oneOf, optWhitespace, Parser, regexp, seq, seqObj, string } from 'parsimmon';
import { assign } from './polyfills';

import {
    binExpression, dice, DICE_MAX, DICE_MIN, diceGroup, DiceGroupModifiers, DiceModifiers, EDice, Expression,
    funcExpression,
    number,
} from './types';
import { diceSidesOf, floatOf, intOf } from './utils';

const DigitsNotZero = regexp(/[1-9]+/).desc('non-zero integer');
const AnyDigits = alt(string('0'), DigitsNotZero).desc('integer');
const FateDice = string('F').desc(`fate dice 'F'`);
const DiceSpec = string('d').desc(`dice specifier 'd'`);

const operatorLow = oneOf('+-%').desc(['+', '-', '%']);
const operatorMed = oneOf('*/').desc(['*', '/']);
const operatorHigh = string('**').desc('**');

const comparisonOperator = oneOf('<>=').desc(['<', '>', '=']);

const openBracket = string('(').desc('open paren');
const closeBracket = string(')').desc('close paren');

const openBrace = string('{').desc('open brace');
const closeBrace = string('}').desc('close brace');

const comma = string(',').desc('comma');

const functionName = alt(
    string('floor'),
    string('round'),
    string('ceil'),
    string('abs'),
);

const AnyFloat = seq(
    string('-').fallback(''),
    AnyDigits.fallback('0'),
    string('.'),
    AnyDigits,
    seq(
        oneOf('eE').desc('e/E'),
        AnyDigits,
    ).desc('exponent').map(all => all.join('')).fallback(''),
).tie().desc('float');

const AnyInt = seq(
    string('-').fallback(''),
    AnyDigits,
    seq(
        oneOf('eE').desc('e/E'),
        AnyDigits,
    ).desc('exponent').map(all => all.join('')).fallback(''),
).tie().desc('integer w/ exponent');

const AnyNum = alt(AnyFloat, AnyInt).desc('number');

const ComparePoint = seq(comparisonOperator.fallback('='), AnyDigits.map(intOf))
    .map(([op, number]) => ({ op, number }));

function diceModifiers(currentModifiers: DiceModifiers[]): Parser<DiceModifiers[]> {
    const keys = currentModifiers.map(mod => Object.keys(mod)[0]);  // each modifier only has one key
    return alt(...[
        {
            name: 'success', combinator: seq(
                ComparePoint,
                seq(string('f').desc(`failure modifier 'f'`),
                    ComparePoint).fallback(null),
            ).map(([success, failure]) => failure === null
                ? [...currentModifiers, { success }]
                : [...currentModifiers, { failure: failure[1] }, { success }]),
        }, {
            name: 'compounding', combinator: seq(
                string('!!').desc(`compounding modifier '!!'`),
                ComparePoint.fallback({ op: '=', number: DICE_MAX }),
            ).map(([_, compounding]) => [...currentModifiers, { compounding }]),
        }, {
            name: 'penetrating', combinator: seq(
                string('!p').desc(`penetrating modifier '!p'`),
                ComparePoint.fallback({ op: '=', number: DICE_MAX }),
            ).map(([_, penetrating]) => ([...currentModifiers, { penetrating }])),
        }, {
            name: 'exploding', combinator: seq(
                string('!').desc(`exploding modifier '!'`),
                ComparePoint.fallback({ op: '=', number: DICE_MAX }),
            ).map(([_, exploding]) => ([...currentModifiers, { exploding }])),
        }, {
            name: 'keep', combinator: seq(
                string('k').desc(`keep modifier 'k'`),
                oneOf('hl').desc('h or l').fallback('h'),
                AnyDigits.map(intOf),
            ).map(([_, direction, number]) => ([...currentModifiers, { keep: { direction, number } }])),
        }, {
            name: 'drop', combinator: seq(
                string('d').desc(`drop modifier 'd'`),
                oneOf('hl').desc('h or l').fallback('l'),
                AnyDigits.map(intOf),
            ).map(([_, direction, number]) => ([...currentModifiers, { drop: { direction, number } }])),
        }, {
            name: 'rerollOnce', combinator: seq(
                string('ro').desc(`reroll once modifier 'ro'`),
                ComparePoint.fallback({ op: '=', number: DICE_MIN }),
            ).map(([_, rerollOnce]) => ([...currentModifiers, { rerollOnce }])),
        }, {
            name: 'sort', combinator: seq(
                string('s').desc(`sort modifier 's'`),
                oneOf('ad').desc('a or d').fallback('a'),
            ).map(([_, direction]) => ([...currentModifiers, { sort: { direction } }])),
        }, {
            name: null, /* always allow rerolls */ combinator: seq(
                string('r').desc(`reroll modifier 'r'`),
                ComparePoint.fallback({ op: '=', number: DICE_MIN }),
            ).map(([_, reroll]) => ([...currentModifiers, { reroll }])),

        },
    ]
        .filter(({ name }) => name === null || keys.indexOf(name) === -1)
        .map(({ combinator }) => combinator));
}

function diceGroupModifiers(currentModifiers: DiceGroupModifiers[]): Parser<DiceGroupModifiers[]> {
    const keys = currentModifiers.map(mod => Object.keys(mod)[0]);  // each modifier only has one key
    return alt(...[
        {
            name: 'success', combinator: seq(
                ComparePoint,
                seq(string('f').desc(`failure modifier 'f'`),
                    ComparePoint).fallback(null),
            ).map(([success, failure]) => failure === null
                ? [...currentModifiers, { success }]
                : [...currentModifiers, { failure: failure[1] }, { success }]),
        }, {
            name: 'keep', combinator: seq(
                string('k').desc(`keep modifier 'k'`),
                oneOf('hl').desc('h or l').fallback('h'),
                AnyDigits.map(intOf),
            ).map(([_, direction, number]) => ([...currentModifiers, { keep: { direction, number } }])),
        }, {
            name: 'drop', combinator: seq(
                string('d').desc(`drop modifier 'd'`),
                oneOf('hl').desc('h or l').fallback('l'),
                AnyDigits.map(intOf),
            ).map(([_, direction, number]) => ([...currentModifiers, { drop: { direction, number } }])),
        },
    ]
        .filter(({ name }) => name === null || keys.indexOf(name) === -1)
        .map(({ combinator }) => combinator));
}

function chainFunc<T>(modParser: (arg: T[]) => Parser<T[]>) {
    return function chain(modifiers: T[]): Parser<DiceModifiers[]> {
        return modParser(modifiers)
            .chain(chain)
            .fallback(modifiers);
    };
}

const MultipleDiceModifiers = of([])
    .chain(chainFunc(diceModifiers));

const MultipleDiceGroupModifiers = of([])
    .chain(chainFunc(diceGroupModifiers));

const language = createLanguage({
    Expr: r => r.ExprLow.trim(optWhitespace),

    ExprLow: r => seq(r.ExprMed, seq(operatorLow.trim(optWhitespace), r.ExprMed).many())
        .map(([head, tail]) => [head, ...tail])
        .mark()
        .map(({ value, ...loc }) => value.reduce((prev, curr) => binExpression({
            loc,
            op: curr[0],
            lhs: prev,
            rhs: curr[1],
        }))),

    ExprMed: r => seq(r.ExprHigh, seq(operatorMed.trim(optWhitespace), r.ExprHigh).many())
        .map(([head, tail]) => [head, ...tail])
        .mark()
        .map(({ value, ...loc }) => value.reduce((prev, curr) => binExpression({
            loc,
            op: curr[0],
            lhs: prev,
            rhs: curr[1],
        }))),

    ExprHigh: r => seq(r.LiteralOrExpr, seq(operatorHigh.trim(optWhitespace), r.LiteralOrExpr).many())
        .map(([head, tail]) => [head, ...tail])
        .mark()
        .map(({ value, ...loc }) => value.reduce((prev, curr) => binExpression({
            loc,
            op: curr[0],
            lhs: prev,
            rhs: curr[1],
        }))),

    LiteralOrExpr: r => alt(r.Function, r.Literal, r.ExprBracketed),

    ExprBracketed: r => seqObj<{ expr: Expression }>(
        openBracket,
        optWhitespace,
        ['expr', r.Expr],
        optWhitespace,
        closeBracket,
    ).map(({ expr }) => expr),

    Function: r => seq(functionName, r.ExprBracketed)
        .mark()
        .map(({ value: [func, arg], ...loc }) => funcExpression({ func, arg, loc })),

    Literal: r => alt(r.Dice, r.Number, r.DiceGroup),

    DiceGroup: r => seqObj<{ firstExpr: Expression, exprs: Expression[], modifiers: DiceGroupModifiers }>(
        openBrace,
        ['firstExpr', r.Expr],
        ['exprs', seq(comma, r.Expr).map(([_, expr]) => expr).many()],
        comma.trim(optWhitespace).fallback(','),
        closeBrace,
        ['modifiers', r.DiceGroupModifiers],
    )
        .mark()
        .map(({ value: { firstExpr, exprs, modifiers }, ...loc }) => diceGroup({
            elements: [firstExpr, ...exprs], loc, ...modifiers,
        })),

    DiceGroupModifiers: () => MultipleDiceGroupModifiers
        .map(modifiers => assign({}, ...modifiers)),

    Dice: r => seq(
        alt(
            r.ExprBracketed,
            AnyDigits.map(intOf),
            of(1),
        ),
        DiceSpec,
        alt(
            r.ExprBracketed,
            AnyDigits.map(diceSidesOf),
            FateDice.map(diceSidesOf),
        ),
        r.DiceModifiers,
    )
        .mark()
        .map(({ value: [noDice, _, diceSides, modifiers], ...loc }) => dice({ noDice, diceSides, ...modifiers, loc })),

    DiceModifiers: () => MultipleDiceModifiers
        .map(modifiers => {
            let reroll = modifiers.filter(mod => 'reroll' in mod).map(mod => mod.reroll);
            return assign({}, ...modifiers.filter(mod => !('reroll' in mod)), reroll.length ? { reroll } : null);
        }),

    Number: () => AnyNum.map(floatOf)
        .mark()
        .map(({ value, ...loc }) => number({ value, loc })),
});

export function parse(s: string): EDice {
    return language.Expr.tryParse(s);
}
