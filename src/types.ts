type WithKind<T, Kind extends string> = T & { kind: Kind };

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

export type EDice = WithKind<DiceAttrs, 'dice'>

export function dice(dice: DiceAttrs): EDice {
    return {
        kind: 'dice',
        ...dice,
    };
}

interface NumberAttrs {
    value: number;
}

export type ENumber = WithKind<NumberAttrs, 'number'>

export function number(num: NumberAttrs | number): ENumber {
    if (typeof num === 'number') {
        return number({ value: num });
    }

    return {
        kind: 'number',
        ...num,
    };
}

interface BinExpressionAttrs {
    op: string,
    lhs: Expression,
    rhs: Expression,
}

export type BinExpression = WithKind<BinExpressionAttrs, 'binExpression'>

export function binExpression(expr: BinExpressionAttrs): BinExpression {
    return {
        kind: 'binExpression',
        ...expr,
    };
}

interface FuncExpressionAttrs {
    func: string,
    arg: Expression,
}

export type FuncExpression = WithKind<FuncExpressionAttrs, 'funcExpression'>

export function funcExpression(expr: FuncExpressionAttrs): FuncExpression {
    return {
        kind: 'funcExpression',
        ...expr,
    };
}

export interface DiceGroupModifiers {
    success?: { op: ModifierOperators, number: number | typeof DICE_MAX };
    failure?: { op: ModifierOperators, number: number | typeof DICE_MAX };
    keep?: { number: number, direction: 'h' | 'l' };
    drop?: { number: number, direction: 'h' | 'l' };
}

interface DiceGroupAttrs extends DiceGroupModifiers{
    elements: Expression[];
}

export type DiceGroup = WithKind<DiceGroupAttrs, 'diceGroup'>

export function diceGroup(expr: DiceGroupAttrs): DiceGroup {
    return {
        kind: 'diceGroup',
        ...expr,
    };
}

export type Expression =
    | EDice
    | ENumber
    | BinExpression
    | DiceGroup
