type WithKind<T, Kind extends string> = T & { kind: Kind };

interface DiceAttrs {
    diceSides: number[];
    noDice: number;
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
        return number({ value: num});
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

export type Expression =
    | EDice
    | ENumber
    | BinExpression
