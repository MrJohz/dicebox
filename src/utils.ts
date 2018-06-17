export function keySelect<T, K extends keyof T>(orig: T, keys: K[]): Pick<T, K> {
    const result: any = {};
    for (const key of keys) {
        if (key in orig) {
            result[key] = orig[key];
        }
    }

    return result;
}
