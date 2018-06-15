import { BinExpression, DiceGroup, EDice, Expression, Location } from './types';

export enum Kind {
    number = 'number',
    sum = 'sum',
    success = 'success',
}

export type CheckError =
    | { type: 'BINOP_INCOMPATIBLE_KINDS', message: string, loc: Location }

export type Result =
    | { success: true, kind: Kind }
    | { success: false, errors: CheckError[] }

export function check(expression: Expression): Result {
    switch (expression.kind) {
        case 'number':
            return { success: true, kind: Kind.number };
        case 'dice':
            return checkDice(expression);
        case 'binExpression':
            return checkBinExpression(expression);
        case 'diceGroup':
            return checkDiceGroup(expression);
    }
}

function combineErrors(...maybeErrors: Result[]): Result {
    const errors = [];
    for (const maybeErr of maybeErrors) {
        if (!maybeErr.success) {
            errors.push(...maybeErr.errors);
        }
    }

    return { success: false, errors };
}

function humanReadableOp(operator: BinExpression['op']): string {
    switch (operator) {
        case '%':
            return 'modulo';
        case '+':
            return 'add';
        case '-':
            return 'subtract';
        case '*':
            return 'multiply';
        case '/':
            return 'divide';
        case '**':
            return 'raise';
    }
}

function checkDice(dice: EDice): Result {
    return { success: true, kind: 'success' in dice ? Kind.success : Kind.sum };
}

function checkBinExpression(expr: BinExpression): Result {
    let lhs = check(expr.lhs);
    let rhs = check(expr.rhs);

    if (!lhs.success || !rhs.success)
        return combineErrors(lhs, rhs);
    if (lhs.kind === rhs.kind)
        return { success: true, kind: lhs.kind };

    if (lhs.kind === Kind.number) {
        return { success: true, kind: rhs.kind };
    } else if (rhs.kind === Kind.number) {
        return { success: true, kind: lhs.kind };
    }

    const error: CheckError = {
        type: 'BINOP_INCOMPATIBLE_KINDS',
        message: `cannot ${humanReadableOp(expr.op)} kinds '${lhs.kind}' and '${rhs.kind}'`,
        loc: expr.loc,
    };

    return { success: false, errors: [error] };
}

function checkDiceGroup(group: DiceGroup): Result {
    console.log(group);
    return { success: true, kind: Kind.success };
}
