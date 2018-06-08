type WithKind<T, Kind extends string> = T & { kind: Kind };

interface DiceAttrs {
    diceSides: number[];
    noDice: number;
}

export type Dice = WithKind<DiceAttrs, 'dice'>

export function dice(dice: DiceAttrs): Dice {
    return {
        kind: 'dice',
        ...dice
    }
}
