import { DiceRollResult, RollSuccess } from '../evaluator';
import { ModifierOperator } from '../types';
import { matchTarget } from '../utils';

type DiceRolls = DiceRollResult | DiceRollResult[]

interface SuccessModifier {
    op: ModifierOperator;
    number: number;
}

export function success(init: DiceRolls, success: SuccessModifier, failure: SuccessModifier | undefined): DiceRolls {
    if (Array.isArray(init)) {
        return init.map(dice => _successSingle(dice, success, failure));
    } else {
        return _successSingle(init, success, failure);
    }
}

export function _successSingle(init: DiceRollResult, success: SuccessModifier, failure: SuccessModifier | undefined): DiceRollResult {
    if (matchTarget(success.op, success.number, init.value)) {
        init.success = RollSuccess.success;
    } else if (failure && matchTarget(failure.op, failure.number, init.value)) {
        init.success = RollSuccess.failure;
    }

    return init;
}
