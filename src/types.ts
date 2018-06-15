import { Index } from 'parsimmon';

export type Location = { start: Index, end: Index }

function defaultLocation(): Location {
    return {
        start: { column: 0, offset: 0, line: 0 },
        end: { column: 0, offset: 0, line: 0 },
    };
}

type WithKind<T, Kind extends string> = T & { kind: Kind }

export const DICE_MAX = 'DICE MAX';
export const DICE_MIN = 'DICE_MIN';

type ModifierOperators = '=' | '<' | '>';

interface DiceAttrs extends DiceModifiers {
    diceSides: number[] | Expression;
    noDice: number | Expression;
}

export interface DiceModifiers {
    success?: { op: ModifierOperators, number: number | typeof DICE_MAX };
    failure?: { op: ModifierOperators, number: number | typeof DICE_MAX };
    exploding?: { op: ModifierOperators, number: number | typeof DICE_MAX };
    compounding?: { op: ModifierOperators, number: number | typeof DICE_MAX };
    penetrating?: { op: ModifierOperators, number: number | typeof DICE_MAX };
    keep?: { number: number, direction: 'h' | 'l' };
    drop?: { number: number, direction: 'h' | 'l' };
    rerollOnce?: { op: ModifierOperators, number: number | typeof DICE_MAX };
    reroll?: ({ op: ModifierOperators, number: number | typeof DICE_MAX })[];
    sort?: ({ direction: 'a' | 'd' });
}

export type EDice = WithKind<DiceAttrs, 'dice'> & { loc: Location }

export function dice(dice: DiceAttrs & { loc?: Location }): EDice {
    return {
        kind: 'dice',
        ...dice,
        loc: dice.loc || defaultLocation(),
    };
}

interface NumberAttrs {
    value: number;
}

export type ENumber = WithKind<NumberAttrs, 'number'> & { loc: Location }

export function number(num: NumberAttrs & { loc?: Location } | number): ENumber {
    if (typeof num === 'number') {
        return number({ value: num });
    }

    return {
        kind: 'number',
        ...num,
        loc: num.loc || defaultLocation(),
    };
}

interface BinExpressionAttrs {
    op: '+' | '-' | '*' | '/' | '**' | '%',
    lhs: Expression,
    rhs: Expression,
}

export type BinExpression = WithKind<BinExpressionAttrs, 'binExpression'> & { loc: Location }

export function binExpression(expr: BinExpressionAttrs & { loc?: Location }): BinExpression {

    return {
        kind: 'binExpression',
        ...expr,
        loc: expr.loc || defaultLocation(),
    };
}

interface FuncExpressionAttrs {
    func: string,
    arg: Expression,
}

export type FuncExpression = WithKind<FuncExpressionAttrs, 'funcExpression'> & { loc: Location }

export function funcExpression(expr: FuncExpressionAttrs & { loc?: Location }): FuncExpression {
    return {
        kind: 'funcExpression',
        ...expr,
        loc: expr.loc || defaultLocation(),
    };
}

export interface DiceGroupModifiers {
    success?: { op: ModifierOperators, number: number | typeof DICE_MAX };
    failure?: { op: ModifierOperators, number: number | typeof DICE_MAX };
    keep?: { number: number, direction: 'h' | 'l' };
    drop?: { number: number, direction: 'h' | 'l' };
}

interface DiceGroupAttrs extends DiceGroupModifiers {
    elements: Expression[];
}

export type DiceGroup = WithKind<DiceGroupAttrs, 'diceGroup'> & { loc: Location };

export function diceGroup(expr: DiceGroupAttrs & { loc?: Location }): DiceGroup {
    return {
        kind: 'diceGroup',
        ...expr,
        loc: expr.loc || defaultLocation(),
    };
}

export type Expression =
    | EDice
    | ENumber
    | BinExpression
    | DiceGroup
