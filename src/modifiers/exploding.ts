import { DiceRoller, DiceRollResult, RollStatus, RollSuccess } from '../evaluator';
import { ModifierOperator } from '../types';
import { matchTarget } from '../utils';

interface ExplodingModifier {
    number: number;
    op: ModifierOperator;
}

type DiceRolls = DiceRollResult | DiceRollResult[]

export function exploding(init: DiceRollResult[], random: DiceRoller, modifier: ExplodingModifier): DiceRollResult[] {
    const exploded = _exploding(init[init.length - 1], random, modifier);
    if (Array.isArray(exploded)) {
        init.splice(-1, 1, ...exploded);
    }
    return init;
}

function _exploding(init: DiceRollResult, random: DiceRoller, modifier: ExplodingModifier): DiceRolls {
    if (!matchTarget(modifier.op, modifier.number, init.value)) return init;  // break out fast

    const rolls = [init];
    while (matchTarget(modifier.op, modifier.number, rolls[rolls.length - 1].value)) {
        rolls.push(...random());
    }

    return rolls;
}

export function compounding(init: DiceRollResult[], random: DiceRoller, modifier: ExplodingModifier): DiceRollResult[] {
    const exploded = _compounding(init[init.length - 1], random, modifier);
    init.splice(-1, 1, exploded);
    return init;
}

function _compounding(init: DiceRollResult, random: DiceRoller, modifier: ExplodingModifier): DiceRollResult {
    if (!matchTarget(modifier.op, modifier.number, init.value)) return init;
    if (init.status === RollStatus.rerolled) return init;

    const roll: DiceRollResult = {
        value: init.value,
        crit: null,
        status: RollStatus.active,
        success: RollSuccess.ignored,
    };

    let lastRoll = init.value;
    while (matchTarget(modifier.op, modifier.number, lastRoll)) {
        const nextDice = random();
        const value = nextDice[nextDice.length - 1].value;
        lastRoll = value;
        roll.value += value;
    }

    return roll;
}

export function penetrating(init: DiceRollResult[], random: DiceRoller, modifier: ExplodingModifier): DiceRollResult[] {
    const exploded = _penetrating(init[init.length - 1], random, modifier);
    if (Array.isArray(exploded)) {
        init.splice(-1, 1, ...exploded);
    }
    return init;
}

function _penetrating(init: DiceRollResult, random: DiceRoller, modifier: ExplodingModifier): DiceRolls {
    const rolls = _exploding(init, random, modifier);
    if (!Array.isArray(rolls)) return rolls;

    return rolls.map((roll, idx) =>
        idx === 0 ? roll : { ...roll, value: roll.value - 1 });
}
