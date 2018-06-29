import { ModifierOperator } from './types';

export function keySelect<T, K extends keyof T>(orig: T, keys: K[]): Pick<T, K> {
    const result: any = {};
    for (const key of keys) {
        if (key in orig) {
            result[key] = orig[key];
        }
    }

    return result;
}

export function diceSidesOf(n: string | number): number[] {
    if (n === 'F') {
        return [-1, 0, 1];
    }

    const arr = [];
    const all = typeof n === 'number' ? n : parseInt(n, 10);
    for (let i = 1; i <= all; i++) {
        arr.push(i);
    }

    return arr;
}

export function intOf(n: string): number {
    return parseInt(n, 10);
}

export function floatOf(n: string): number {
    return parseFloat(n);
}

export function matchTarget(op: ModifierOperator, target: number, value: number): boolean {
    switch (op) {
        case '<':
            return value < target;
        case '=':
            return value === target;
        case '>':
            return value > target;
    }
}
