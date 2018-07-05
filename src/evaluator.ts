import { Kind } from './checker';
import { compounding, exploding, penetrating } from './modifiers/exploding';
import { keep as keepMod, drop as dropMod } from './modifiers/keep';
import { success } from './modifiers/success';
import { Randomiser, SimpleRandom } from './random';
import {
    BinaryOperator, BinExpression, DICE_MAX, DICE_MIN, DiceGroup, DiceGroupModifiers, EDice, ENumber, Expression,
    FuncExpression, Location,
} from './types';
import { diceSidesOf, keySelect, matchTarget } from './utils';

const FUNCTION_IMPLS: { [key: string]: (a: number) => number } = {
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    abs: Math.abs,
};

export enum RollSuccess {
    success = 1,
    ignored = 0,
    failure = -1,
}

export interface ENumberResult {
    nodeKind: 'number';
    loc: Location;
    value: number;
}

export enum DiceRollCrit {
    MAX = 'max',
    MIN = 'min',
}

export enum DiceRollStatus {
    active = 'active',
    dropped = 'dropped',
    rerolled = 'rerolled',
}

export interface DiceRollResult {
    value: number;
    status: DiceRollStatus;
    crit: DiceRollCrit | null;
    success: RollSuccess;
}

export interface DiceExpressionResult {
    nodeKind: 'dice';
    loc: Location;
    value: number;
    noDice: number | ExpressionResult;
    diceSides: number[] | ExpressionResult;
    rolls: Array<DiceRollResult | DiceRollResult[]>;
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
    elements: { expr: ExpressionResult, dropped: boolean, success: RollSuccess }[];
    modifiers: DiceGroupModifiers;
}

export interface FuncExpressionResult {
    nodeKind: 'funcExpression';
    loc: Location;
    value: number;
    funcName: string;
    arg: ExpressionResult;
}

export type ExpressionResult =
    | ENumberResult
    | BinExpressionResult
    | DiceGroupResult
    | FuncExpressionResult
    | DiceExpressionResult

export class Result {
    constructor(public value: number, public kind: Kind, public tree: ExpressionResult) {}
}

export type DiceRoller = () => DiceRollResult[];

export class Evaluator {

    constructor(private random: Randomiser = new SimpleRandom()) {}

    evaluate(expression: Expression): Result {
        switch (expression.kind) {
            case 'number':
                return this.evaluateNumber(expression);
            case 'binExpression':
                return this.evaluateBinExpression(expression);
            case 'diceGroup':
                return this.evaluateDiceGroup(expression);
            case 'funcExpression':
                return this.evaluateFuncExpression(expression);
            case 'dice':
                return this.evaluateDice(expression);
        }
    }

    private evalNoDice(noDice: number | Expression): [number, number | ExpressionResult] {
        if (typeof noDice === 'number') {
            return [noDice, noDice];
        } else {
            const e = this.evaluate(noDice);
            return [e.value, e.tree];
        }
    }

    private evalDiceSides(diceSides: number[] | Expression): [number[], number[] | ExpressionResult] {
        if (Array.isArray(diceSides)) {
            return [diceSides, diceSides];
        } else {
            const e = this.evaluate(diceSides);
            return [diceSidesOf(e.value), e.tree];
        }
    }

    private rollDice(diceSides: number[]): DiceRollResult {
        const value = diceSides[this.random.between(0, diceSides.length)];
        return {
            value,
            crit: crit(value, diceSides[diceSides.length - 1], diceSides[0]),
            status: DiceRollStatus.active,
            success: RollSuccess.ignored,
        };
    }

    private evaluateDice(expr: EDice): Result {
        const [noDice, noDiceTree] = this.evalNoDice(expr.noDice);
        const [diceSides, diceSidesTree] = this.evalDiceSides(expr.diceSides);
        const maxVal = diceSides[diceSides.length - 1];
        const minVal = diceSides[0];

        const rolls: Array<DiceRollResult | DiceRollResult[]> = [];

        const roller = () => {
            if (!expr.reroll) return [this.rollDice(diceSides)];

            const rolls = [];

            nextroll: while (true) {
                const roll = this.rollDice(diceSides);
                rolls.push(roll);
                for (const test of expr.reroll) {
                    if (matchTarget(test.op, deMaxify(test.number, maxVal, minVal), roll.value)) {
                        roll.status = DiceRollStatus.rerolled;
                        continue nextroll;
                    }
                }

                return rolls;
            }
        };

        const keepState: Array<DiceRollResult> = [];
        const dropState: Array<DiceRollResult> = [];

        let successKind = false;

        for (let i = 0; i < noDice; i++) {
            let roll: DiceRollResult[] = roller();
            if (expr.exploding) {
                const mod = {
                    op: expr.exploding.op,
                    number: deMaxify(expr.exploding.number, maxVal, minVal),
                };
                roll = exploding(roll, roller, mod);
            } else if (expr.compounding) {
                const mod = {
                    op: expr.compounding.op,
                    number: deMaxify(expr.compounding.number, maxVal, minVal),
                };
                roll = compounding(roll, roller, mod);
            } else if (expr.penetrating) {
                const mod = {
                    op: expr.penetrating.op,
                    number: deMaxify(expr.penetrating.number, maxVal, minVal),
                };
                roll = penetrating(roll, roller, mod);
            }

            if (expr.keep) {
                roll = keepMod(roll, expr.keep, keepState);
            }

            if (expr.drop) {
                roll = dropMod(roll, expr.drop, dropState);
            }

            if (expr.success) {
                successKind = true;
                roll = success(roll, expr.success, expr.failure);
            }

            if (Array.isArray(roll) && roll.length === 1) {
                rolls.push(roll[0]);
            } else {
                rolls.push(roll);
            }
        }

        let sum;
        if (successKind) {
            sum = rolls.reduce((total, dice) => total + (Array.isArray(dice)
                ? dice.reduce((total, dice) => total + successValue(dice), 0)
                : successValue(dice)), 0);
        } else {
            sum = rolls.reduce((total, dice) => total + (Array.isArray(dice)
                ? dice.reduce((total, dice) => total + diceValue(dice), 0)
                : diceValue(dice)), 0);
        }

        return new Result(sum, successKind ? Kind.success : Kind.sum, {
            nodeKind: 'dice', loc: expr.loc,
            noDice: noDiceTree,
            diceSides: diceSidesTree,
            value: sum,
            rolls,
        });
    }

    private evaluateFuncExpression(expr: FuncExpression): Result {
        const arg = this.evaluate(expr.arg);

        /* istanbul ignore else */
        if (expr.func in FUNCTION_IMPLS) {
            const value = FUNCTION_IMPLS[expr.func](arg.value);
            return new Result(value, arg.kind, {
                nodeKind: 'funcExpression',
                loc: expr.loc,
                value,
                arg: arg.tree,
                funcName: expr.func,
            });
        } else {
            throw new Error(`Invalid function name ${expr.func}`);
        }
    }

    private evaluateNumber(num: ENumber): Result {
        return new Result(num.value, Kind.number, {
            nodeKind: 'number', loc: num.loc,
            value: num.value,
        });
    }

    private evaluateBinExpression(expr: BinExpression): Result {
        const lhs = this.evaluate(expr.lhs);
        const rhs = this.evaluate(expr.rhs);

        const value = binaryEval(expr.op, lhs.value, rhs.value);

        let returnKind = Kind.sum;  // default - shouldn't be needed if `checker` is run beforehand
        if (lhs.kind === rhs.kind) {
            returnKind = lhs.kind;
        } else if (lhs.kind === Kind.number) {
            returnKind = rhs.kind;
        } else if (rhs.kind === Kind.number) {
            returnKind = lhs.kind;
        }

        return new Result(value, returnKind, {
            nodeKind: 'binExpression', loc: expr.loc,
            value,
            lhs: lhs.tree, rhs: rhs.tree, op: expr.op,
        });
    }

    private evaluateDiceGroup(expr: DiceGroup): Result {
        let returnSuccesses = false;
        let elements = expr.elements.map(elem => ({
            expr: this.evaluate(elem),
            dropped: false,
            success: RollSuccess.ignored,
        }));

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
                    result.success = RollSuccess.success;
                } else if (failure) {
                    result.success = RollSuccess.failure;
                } else {
                    result.success = RollSuccess.ignored;
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

function diceValue(dice: DiceRollResult): number {
    return dice.status === DiceRollStatus.active ? dice.value : 0;
}

function successValue(dice: DiceRollResult): number {
    return dice.status === DiceRollStatus.active ? dice.success : 0;
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

function crit(n: number, max: number, min: number): DiceRollCrit | null {
    switch (n) {
        case max:
            return DiceRollCrit.MAX;
        case min:
            return DiceRollCrit.MIN;
        default:
            return null;
    }
}

function deMaxify(n: number | typeof DICE_MAX | typeof DICE_MIN, max: number, min: number): number {
    switch (n) {
        case DICE_MAX:
            return max;
        case DICE_MIN:
            return min;
        default:
            return n;
    }
}
