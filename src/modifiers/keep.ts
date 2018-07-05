import { DiceRollResult, RollStatus } from '../evaluator';

type KeepModifier = { number: number, direction: 'h' | 'l' }

export function keep(init: DiceRollResult[], modifier: KeepModifier, state: DiceRollResult[]): DiceRollResult[] {
    return init.map(roll => _keepSingle(roll, modifier, state));
}

function _keepSingle(init: DiceRollResult, modifier: KeepModifier, state: DiceRollResult[]): DiceRollResult {
    if (init.status !== RollStatus.active) return init;

    if (state.length === 0) {
        state.push(init);
        return init;
    }

    let dropInit = true;

    for (let idx = 0; idx < state.length; idx++) {
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
        reject.status = RollStatus.dropped;
    }

    if (dropInit) {
        init.status = RollStatus.dropped;
    }

    return init;
}

export function drop(init: DiceRollResult[], modifier: KeepModifier, state: DiceRollResult[]): DiceRollResult[] {
    return init.map(roll => _dropSingle(roll, modifier, state));
}

function _dropSingle(init: DiceRollResult, modifier: KeepModifier, state: DiceRollResult[]): DiceRollResult {
    if (init.status !== RollStatus.active) return init;

    if (state.length === 0) {
        state.push(init);
        init.status = RollStatus.dropped;
        return init;
    }

    for (let idx = 0; idx < state.length; idx++) {
        const roll = state[idx];
        const test = modifier.direction === 'h'
            ? init.value > roll.value   // drop highest n
            : init.value < roll.value;  // drop lowest n

        if (test) {
            init.status = RollStatus.dropped;
            state.splice(idx, 0, init);
            break;
        }
    }

    const reclaims = state.splice(modifier.number);
    for (const reclaim of reclaims) {
        reclaim.status = RollStatus.active;
    }

    return init;
}
