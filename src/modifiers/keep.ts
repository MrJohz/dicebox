import { DiceRollResult } from '../evaluator';

type KeepModifier = { number: number, direction: 'h' | 'l' }
type DiceRolls = DiceRollResult | DiceRollResult[]

export function keep(init: DiceRolls, modifier: KeepModifier, state: DiceRollResult[]): DiceRolls {
    if (Array.isArray(init)) {
        return init.map(roll => _keepSingle(roll, modifier, state));
    } else {
        return _keepSingle(init, modifier, state);
    }
}

function _keepSingle(init: DiceRollResult, modifier: KeepModifier, state: DiceRollResult[]): DiceRollResult {
    if (state.length === 0) {
        state.push(init);
        return init;
    }

    let dropInit = true;

    for (let idx = 0; idx < state.length; idx ++) {
        const roll = state[idx];
        const test = modifier.direction === 'h'
            ? init.value > roll.value   // drop highest n
            : init.value < roll.value;  // drop lowest n

        if (test) {
            state.splice(idx, 0, init);
            dropInit = false;
            break;
        }
    }

    const rejects = state.splice(modifier.number);
    for (const reject of rejects) {
        reject.dropped = true;
    }

    if (dropInit) {
        init.dropped = true;
    }

    return init;
}

export function drop(init: DiceRolls, modifier: KeepModifier, state: DiceRollResult[]): DiceRolls {
    if (Array.isArray(init)) {
        return init.map(roll => _dropSingle(roll, modifier, state));
    } else {
        return _dropSingle(init, modifier, state);
    }
}

function _dropSingle(init: DiceRollResult, modifier: KeepModifier, state: DiceRollResult[]): DiceRollResult {
    if (state.length === 0) {
        state.push(init);
        init.dropped = true;
        return init;
    }

    for (let idx = 0; idx < state.length; idx ++) {
        const roll = state[idx];
        const test = modifier.direction === 'h'
            ? init.value >= roll.value   // drop highest n
            : init.value <= roll.value;  // drop lowest n

        if (test) {
            init.dropped = true;
            state.splice(idx, 0, init);
            break;
        }
    }

    const rejects = state.splice(modifier.number);
    for (const reject of rejects) {
        reject.dropped = false;
    }

    return init;
}
