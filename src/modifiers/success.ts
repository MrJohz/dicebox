import { DiceRollResult, RollSuccess } from '../evaluator';
import { ModifierOperator } from '../types';
import { matchTarget } from '../utils';

interface SuccessModifier {
    op: ModifierOperator;
    number: number;
}

export function success(init: DiceRollResult[], success: SuccessModifier, failure: SuccessModifier | undefined): DiceRollResult[] {
    return init.map(dice => _successSingle(dice, success, failure));
}

export function _successSingle(init: DiceRollResult, success: SuccessModifier, failure: SuccessModifier | undefined): DiceRollResult {
    if (matchTarget(success.op, success.number, init.value)) {
        init.success = RollSuccess.success;
    } else if (failure && matchTarget(failure.op, failure.number, init.value)) {
        init.success = RollSuccess.failure;
    }

    return init;
}
