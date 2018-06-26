export function foreverPromise(): Promise<never> {
    return new Promise<never>(() => {}) as Promise<never>;  // will never resolve
}

type VoidFunc = () => Promise<void>;

export function resolveOnTrigger<T>(value: T): { p: Promise<T>, trigger: VoidFunc } {
    let trigger: VoidFunc = async () => {
        throw new Error('promise not yet initialised - this should not happen');
    };

    return {
        p: new Promise<T>((resolve) => {
            trigger = async () => resolve(value);
        }),
        trigger,
    };
}
