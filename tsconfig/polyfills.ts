// Polyfill taken and adapted for TypeScript from
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
// Any copyright is dedicated to the Public Domain. http://creativecommons.org/publicdomain/zero/1.0/

export function assign<T>(target: T): T;
export function assign<T, U>(target: T, source: U): T & U;
export function assign<T, U, V>(target: T, source1: U, source2: V): T & U & V;
export function assign<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
export function assign(target: any, ...varargs: any[]): any;
export function assign(target: any, ...varargs: any[]): any {
    if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
    }

    const to = Object(target);

    for (const nextSource of varargs) {
        if (nextSource != null) {
            for (const nextKey in nextSource) {
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
    }

    return to;
}
