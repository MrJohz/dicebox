import { createLanguage, alt, string, regexp, seq, oneOf, optWhitespace, of, Parser } from 'parsimmon';

import {
    EDice,
    dice,
    number,
    binExpression,
    funcExpression,
    DICE_MAX,
    DICE_MIN,
    DiceModifiers,
    diceGroup,
} from './types';

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

const comparisonOperator = oneOf('<>=').desc('< or > or =');

const openBracket = string('(').desc('open paren');
const closeBracket = string(')').desc('close paren');

const openBrace = string('{').desc('open brace');
const closeBrace = string('}').desc('close brace');

const comma = string(',').desc('comma');

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

const ComparePoint = seq(comparisonOperator.fallback('='), AnyDigits.map(intOf))
    .map(([op, number]) => ({ op, number }));

function diceModifiers(currentModifers: DiceModifiers[]) {
    const keys = currentModifers.map(mod => Object.keys(mod)[0]);  // each modifier only has one key
    return alt(...[
        {
            name: 'success', combinator: seq(
                ComparePoint,
                seq(string('f').desc(`failure modifier 'f'`),
                    ComparePoint).fallback(null),
            ).map(([success, failure]) => failure === null
                ? [...currentModifers, { success }]
                : [...currentModifers, { failure: failure[1] }, { success }]),
        }, {
            name: 'compounding', combinator: seq(
                string('!!').desc(`compounding modifier '!!'`),
                ComparePoint.fallback({ op: '=', number: DICE_MAX }),
            ).map(([_, compounding]) => [...currentModifers, { compounding }]),
        }, {
            name: 'penetrating', combinator: seq(
                string('!p').desc(`penetrating modifier '!p'`),
                ComparePoint.fallback({ op: '=', number: DICE_MAX }),
            ).map(([_, penetrating]) => ([...currentModifers, { penetrating }])),
        }, {
            name: 'exploding', combinator: seq(
                string('!').desc(`exploding modifier '!'`),
                ComparePoint.fallback({ op: '=', number: DICE_MAX }),
            ).map(([_, exploding]) => ([...currentModifers, { exploding }])),
        }, {
            name: 'keep', combinator: seq(
                string('k').desc(`keep modifier 'k'`),
                oneOf('hl').desc('h or l').fallback('h'),
                AnyDigits.map(intOf),
            ).map(([_, direction, number]) => ([...currentModifers, { keep: { direction, number } }])),
        }, {
            name: 'drop', combinator: seq(
                string('d').desc(`drop modifier 'd'`),
                oneOf('hl').desc('h or l').fallback('l'),
                AnyDigits.map(intOf),
            ).map(([_, direction, number]) => ([...currentModifers, { drop: { direction, number } }])),
        }, {
            name: 'rerollOnce', combinator: seq(
                string('ro').desc(`reroll once modifier 'ro'`),
                ComparePoint.fallback({ op: '=', number: DICE_MAX }),
            ).map(([_, rerollOnce]) => ([...currentModifers, { rerollOnce }])),
        }, {
            name: 'sort', combinator: seq(
                string('s').desc(`sort modifier 's'`),
                oneOf('ad').desc('a or d').fallback('a'),
            ).map(([_, direction]) => ([...currentModifers, { sort: { direction } }])),
        }, {
            name: null, /* always allow rerolls */ combinator: seq(
                string('r').desc(`reroll modifier 'r'`),
                ComparePoint.fallback({ op: '=', number: DICE_MIN }),
            ).map(([_, reroll]) => ([...currentModifers, { reroll }])),

        },
    ]
        .filter(({ name }) => name === null || keys.indexOf(name) === -1)
        .map(({ combinator }) => combinator));
}

function chainFunc(modifiers: DiceModifiers[]): Parser<DiceModifiers[]> {
    return diceModifiers(modifiers)
        .chain(chainFunc)
        .fallback(modifiers);
}

const MultipleDiceModifiers = of([])
    .chain(chainFunc);

const language = createLanguage({
    Expr: r => r.ExprLow.trim(optWhitespace),

    ExprBracketed: r => seq(openBracket.skip(optWhitespace), r.Expr, optWhitespace.then(closeBracket))
        .map(([_, expr]) => expr),

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

    LiteralOrExpr: r => alt(r.Function, r.Literal, r.ExprBracketed),

    Function: r => seq(functionName, r.ExprBracketed)
        .map(([func, arg]) => funcExpression({ func, arg })),

    Literal: r => alt(r.Dice, r.Number, r.DiceGroup),

    DiceGroup: r => seq(
        openBrace,
        r.Expr,
        seq(comma.trim(optWhitespace), r.Expr).many(),
        comma.trim(optWhitespace).fallback(','),
        closeBrace,
    ).map(([_, expr, exprs]) => diceGroup({ elements: [expr, ...exprs.map(([_, expr]) => expr)] })),

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
        MultipleDiceModifiers
            .map(modifiers => {
                let modifierAggregate: any = {};
                for (const modifier of modifiers) {
                    if ('reroll' in modifier) {
                        if ('reroll' in modifierAggregate) {
                            modifierAggregate.reroll.push(modifier.reroll);
                        } else {
                            modifierAggregate.reroll = [modifier.reroll];
                        }
                    } else {
                        modifierAggregate = { ...modifierAggregate, ...modifier };
                    }
                }
                return modifierAggregate;
            }),
    )
        .map(([noDice, _, diceSides, modifiers]) => dice({ noDice, diceSides, ...modifiers })),

    Number: () => AnyNum.map(floatOf).map(value => number({ value })),
});

export function parse(s: string): EDice {
    return language.Expr.tryParse(s);
}
