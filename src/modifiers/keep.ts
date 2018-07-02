import { DiceRoller, DiceRollResult } from '../evaluator';

type KeepModifer = { number: number, direction: 'h' | 'l' }
type DiceRolls = DiceRollResult | DiceRollResult[]

export function keep(init: DiceRolls, random: DiceRoller, modifier: KeepModifer, state: DiceRollResult[]): DiceRolls {
    if (Array.isArray(init)) {
        return init.map(roll => _keepSingle(roll, modifier, state));
    } else {
        return _keepSingle(init, modifier, state);
    }
}

function _keepSingle(init: DiceRollResult, modifier: KeepModifer, state: DiceRollResult[]): DiceRollResult {
    // console.log(init, state);
    if (state.length === 0) {
        state.push(init);
        return init;
    }

    for (let idx = 0; idx < state.length; idx ++) {
        const roll = state[idx];
        if (init.value > roll.value) {  // N.B. test w/ modifier.direction
            state.splice(idx, 0, init);
            break;
        }
    }

    const rejects = state.splice(modifier.number);
    for (const reject of rejects) {
        reject.dropped = true;
    }

    return init;
}
