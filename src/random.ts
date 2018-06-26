import Random, { Engine, MT19937 } from 'random-js';

export interface Randomiser {
    between(bottom: number, top: number): number;
}

export class SimpleRandom implements Randomiser {
    between(bottom: number, top: number): number {
        return Math.floor(Math.random() * (top - bottom)) + bottom;
    }
}

abstract class EngineRandom implements Randomiser {
    protected engine!: Engine;

    between(bottom: number, top: number): number {
        // TODO: add assertions here to ensure correct usage
        return Random.integer(bottom, top - 1)(this.engine);
    }
}

export class CryptoRandom extends EngineRandom {
    engine = Random.engines.browserCrypto;
}

export class SeededRandom extends EngineRandom {

    engine: MT19937;

    constructor(seed?: number | number[]) {
        super();
        this.engine = Random.engines.mt19937();

        if (!seed) {
            this.engine.autoSeed();
        } else if (Array.isArray(seed)) {
            this.engine.seedWithArray(seed);
        } else {
            this.engine.seed(seed);
        }
    }
}

export type Fetcher = () => Promise<number | number[]>;

export class FetchRandom extends EngineRandom {

    private fetch: Fetcher;
    private refreshAt: number;
    private twister = Random.engines.mt19937();
    private callCount = 0;

    seed(seed: number | number[]) {
        if (Array.isArray(seed)) {
            this.twister.seedWithArray(seed);
        } else {
            this.twister.seed(seed);
        }
    }

    fetchNewSeed() {
        this.fetch().then(seed => this.seed(seed));
    }

    engine = (): number => {
        if (this.callCount >= this.refreshAt) this.fetchNewSeed();
        this.callCount += 1;

        return this.twister();
    };

    constructor(seed: number | number[], fetch: Fetcher, refreshAt?: number) {
        super();
        this.fetch = fetch;
        this.refreshAt = refreshAt || 100;

        this.seed(seed);
        this.fetchNewSeed();
    }

}
