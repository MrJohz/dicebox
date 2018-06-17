import { Kind } from './checker';
import {
    BinaryOperator, BinExpression, DiceGroup, DiceGroupModifiers, ENumber, Expression, Location, ModifierOperator,
    number,
} from './types';
import { keySelect } from './utils';

export interface ENumberResult {
    nodeKind: 'number';
    loc: Location;
    value: number;
}

export interface BinExpressionResult {
    nodeKind: 'binExpression';
    loc: Location;
    value: number;
    lhs: ExpressionResult;
    rhs: ExpressionResult;
    op: BinaryOperator;
}

export interface DiceGroupResult {
    nodeKind: 'diceGroup';
    loc: Location;
    value: number;
    elements: { expr: ExpressionResult, dropped: boolean, success: number }[];
    modifiers: DiceGroupModifiers;
}

export type ExpressionResult =
    | ENumberResult
    | BinExpressionResult
    | DiceGroupResult

export class Result {
    constructor(public value: number, public kind: Kind, public tree: ExpressionResult) {}
}

export class Evaluator {
    evaluate(expression: Expression): Result {
        switch (expression.kind) {
            case 'number':
                return this.evaluateNumber(expression);
            case 'binExpression':
                return this.evaluateBinExpression(expression);
            case 'diceGroup':
                return this.evaluateDiceGroup(expression);
            // case 'dice':
            //     return this.evaluateDice(expression);
            default:
                throw new Error('?');
        }
    }

    evaluateNumber(num: ENumber): Result {
        return new Result(num.value, Kind.number, {
            nodeKind: 'number', loc: num.loc,
            value: num.value,
        });
    }

    evaluateBinExpression(expr: BinExpression): Result {
        const lhs = this.evaluate(expr.lhs);
        const rhs = this.evaluate(expr.rhs);

        const value = binaryEval(expr.op, lhs.value, rhs.value);

        return new Result(value, Kind.success, {
            nodeKind: 'binExpression', loc: expr.loc,
            value,
            lhs: lhs.tree, rhs: rhs.tree, op: expr.op,
        });
    }

    evaluateDiceGroup(expr: DiceGroup): Result {
        let returnSuccesses = false;
        let elements = expr.elements.map(elem => ({ expr: this.evaluate(elem), dropped: false, success: 0 }));

        if (expr.drop) {
            for (let i = 0; i < expr.drop.number; i++) {
                const undroppedElems = elements
                    .filter(elem => !elem.dropped);
                const dropElem = drop(undroppedElems.map(elem => elem.expr), expr.drop.direction);

                undroppedElems[dropElem].dropped = true;
            }
        }

        if (expr.keep) {
            // only drop elements that we haven't already dropped
            const droppableElems = elements
                .filter(elem => !elem.dropped)
                .map(elem => (elem.dropped = true) && elem);  // and assume that they're all going to be dropped
            for (let i = 0; i < expr.keep.number; i++) {
                const notYetChosen = droppableElems
                    .filter(elem => elem.dropped);
                const keepElem = keep(notYetChosen.map(elem => elem.expr), expr.keep.direction);

                notYetChosen[keepElem].dropped = false;
            }
        }

        if (expr.success) {
            returnSuccesses = true;
            for (const result of elements) {
                const success = matchTarget(expr.success.op, expr.success.number, result.expr.value);
                const failure = expr.failure
                    ? matchTarget(expr.failure.op, expr.failure.number, result.expr.value)
                    : false;

                if (success) {
                    result.success = 1;
                } else if (failure) {
                    result.success = -1;
                } else {
                    result.success = 0;
                }
            }
        }

        if (returnSuccesses) {
            const value = elements.reduce((acc, elem) => elem.dropped ? acc : elem.success + acc, 0);
            return new Result(value, Kind.success, {
                nodeKind: 'diceGroup', loc: expr.loc,
                value, elements: elements.map(expr => ({ ...expr, expr: expr.expr.tree })),
                modifiers: keySelect(expr, ['success', 'drop', 'keep', 'failure']),
            });
        } else {
            const value = elements.reduce((acc, elem) => elem.dropped ? acc : elem.expr.value + acc, 0);
            return new Result(value, Kind.sum, {
                nodeKind: 'diceGroup', loc: expr.loc,
                value, elements: elements.map(expr => ({ ...expr, expr: expr.expr.tree })),
                modifiers: keySelect(expr, ['success', 'drop', 'keep', 'failure']),
            });
        }
    }
}

function drop(rolls: Result[], direction: 'l' | 'h'): number {
    let sentinel = direction === 'l' ? Infinity : -Infinity;
    let idx = -1;
    for (let i = 0; i < rolls.length; i++) {
        const roll = rolls[i];
        if (direction === 'l' && roll.value < sentinel) {
            sentinel = roll.value;
            idx = i;
        } else if (direction === 'h' && roll.value > sentinel) {
            sentinel = roll.value;
            idx = i;
        }
    }

    return idx;
}

function keep(rolls: Result[], direction: 'l' | 'h'): number {
    let sentinel = direction === 'h' ? -Infinity : Infinity;
    let idx = -1;
    for (let i = 0; i < rolls.length; i++) {
        const roll = rolls[i];
        if (direction === 'h' && roll.value > sentinel) {
            sentinel = roll.value;
            idx = i;
        } else if (direction === 'l' && roll.value < sentinel) {
            sentinel = roll.value;
            idx = i;
        }
    }

    return idx;
}

function matchTarget(op: ModifierOperator, target: number, value: number): boolean {
    switch (op) {
        case '<':
            return value < target;
        case '=':
            return value === target;
        case '>':
            return value > target;
    }
}

function binaryEval(op: BinaryOperator, lhs: number, rhs: number): number {
    switch (op) {
        case '+':
            return lhs + rhs;
        case '-':
            return lhs - rhs;
        case '*':
            return lhs * rhs;
        case '/':
            return lhs / rhs;
        case '**':
            return Math.pow(lhs, rhs);
        case '%':
            return lhs % rhs;
    }
}
