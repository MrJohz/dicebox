type WithKind<T, Kind extends string> = T & { kind: Kind };

interface DiceAttrs {
    diceSides: number[];
    noDice: number;
}

export type EDice = WithKind<DiceAttrs, 'dice'>

export function dice(dice: DiceAttrs): EDice {
    return {
        kind: 'dice',
        ...dice
    }
}

interface NumberAttrs {
    value: number;
}

export type ENumber = WithKind<NumberAttrs, 'number'>

export function number(number: NumberAttrs): ENumber {
    return {
        kind: 'number',
        ...number
    }
}

export type Expression =
    | EDice
    | ENumber
