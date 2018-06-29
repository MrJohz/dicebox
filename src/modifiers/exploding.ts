import { DiceRoller, DiceRollResult, RollSuccess } from '../evaluator';
import { ModifierOperator } from '../types';
import { matchTarget } from '../utils';

interface ExplodingModifier {
    number: number;
    op: ModifierOperator;
}

export function exploding(init: DiceRollResult, random: DiceRoller, modifier: ExplodingModifier): DiceRollResult | DiceRollResult[] {
    if (!matchTarget(modifier.op, modifier.number, init.value)) return init;  // break out fast

    const rolls = [init];
    while (matchTarget(modifier.op, modifier.number, rolls[rolls.length - 1].value)) {
        rolls.push(random());
    }

    return rolls;
}

interface CompoundingModifier {
    number: number;
    op: ModifierOperator;
}

export function compounding(init: DiceRollResult, random: DiceRoller, modifier: CompoundingModifier): DiceRollResult {
    if (!matchTarget(modifier.op, modifier.number, init.value)) return init;

    const roll: DiceRollResult = {
        value: init.value,
        crit: null,
        dropped: false,
        success: RollSuccess.ignored,
    };

    let lastRoll = init.value;
    while (matchTarget(modifier.op, modifier.number, lastRoll)) {
        const value = random().value;
        lastRoll = value;
        roll.value += value;
    }

    return roll;
}
