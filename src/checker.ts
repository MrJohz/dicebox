import { BinExpression, DiceGroup, EDice, Expression, FuncExpression, Location } from './types';

export enum Kind {
    number = 'number',
    sum = 'sum',
    success = 'success',
}

export type CheckError =
    | { type: 'BINOP_INCOMPATIBLE_KINDS', message: string, loc: Location }
    | { type: 'GROUP_INCOMPATIBLE_KINDS', message: string, loc: Location }

type SuccessResult = { success: true, kind: Kind };
type ErrorResult = { success: false, errors: CheckError[] };

export type Result =
    | SuccessResult
    | ErrorResult

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
        case 'funcExpression':
            return checkFuncExpression(expression);
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
            return 'raise to power';
    }
}

function checkDice(dice: EDice): Result {
    return { success: true, kind: 'success' in dice ? Kind.success : Kind.sum };
}

function checkBinExpression(expr: BinExpression): Result {
    let lhs = check(expr.lhs);
    let rhs = check(expr.rhs);

    if (!lhs.success || !rhs.success) {
        return combineErrors(lhs, rhs);
    } else if (lhs.kind === rhs.kind) {
        return { success: true, kind: lhs.kind };
    } else if (lhs.kind === Kind.number) {
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
    const groupChecks = group.elements.map(elem => ({ elem, check: check(elem) }));

    const existingFailures = groupChecks.filter(elem => elem.check.success === false);
    if (existingFailures.length > 1) {
        return combineErrors(...existingFailures.map(elem => elem.check));
    }

    // type assertion to make life easier for us
    const exprs = groupChecks as { elem: DiceGroup, check: SuccessResult }[];

    const errors: CheckError[] = [];
    const initType = exprs[0].check.kind;

    for (const expr of exprs) {
        if (expr.check.kind !== initType) {
            errors.push({
                type: 'GROUP_INCOMPATIBLE_KINDS',
                message: `cannot mix kinds '${initType}' and '${expr.check.kind}'`,
                loc: expr.elem.loc,
            });
        }
    }

    if (errors.length) {
        return { success: false, errors };
    } else {
        return { success: true, kind: initType };
    }
}

function checkFuncExpression(func: FuncExpression): Result {
    // TODO: could check for valid functions here?
    return check(func.arg);
}
