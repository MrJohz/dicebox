import expect from 'must';
import { FetchRandom, SeededRandom, SimpleRandom } from '../../src/random';
import { foreverPromise, resolveOnTrigger } from '../promises.util';

describe('random', () => {

    describe('SimpleRandom', () => {

        it('should return a random number between top and bottom', () => {
            const random = new SimpleRandom();
            const results = [];
            for (let i = 0; i < 1000; i++) {  // do it 1000 times to alleviate lack of reproducibility
                const n = random.between(0, 2);
                results.push(n);
                expect(n).to.be.gte(0);
                expect(n).to.be.lt(2);
            }

            // chance of failure here = 0.5^1000 ~ 10^-302 - very unlikely to fail!
            // ...assuming that the code is working of course!
            expect(results).to.contain(0);
            expect(results).to.contain(1);
            expect(results).not.to.contain(2);
        });

    });

    describe('SeededRandom', () => {

        it('always returns the same results when passed a seed', () => {
            const random1 = new SeededRandom(100);
            expect(random1.between(0, 100000000)).to.equal(33906440);

            const random2 = new SeededRandom([936]);
            expect(random2.between(0, 100000000)).to.equal(64812794);
        });

        it('should produce the same results as SimpleRandom when no seed is passed', () => {
            const random = new SeededRandom();
            const results = [];
            for (let i = 0; i < 1000; i++) {  // do it 1000 times to alleviate lack of reproducibility
                const n = random.between(0, 2);
                results.push(n);
                expect(n).to.be.gte(0);
                expect(n).to.be.lt(2);
            }

            // chance of failure here = 0.5^1000 ~ 10^-302 - very unlikely to fail!
            // ...assuming that the code is working of course!
            expect(results).to.contain(0);
            expect(results).to.contain(1);
            expect(results).not.to.contain(2);
        });

        it('should set the seed to 0 if 0 is passed', () => {
            const random = new SeededRandom(0);
            expect(random.between(0, 100000000)).to.equal(57136044);
        })

    });

    describe('FetchRandom', () => {

        it('should return the same as SeededRandom for the first attempt', () => {
            const random1 = new FetchRandom(100, foreverPromise);
            expect(random1.between(0, 100000000)).to.equal(33906440);

            const random2 = new FetchRandom([936], foreverPromise);
            expect(random2.between(0, 100000000)).to.equal(64812794);
        });

        it('should update the seed when fetch function resolves', async () => {
            const { p, trigger } = resolveOnTrigger([936]);
            const random = new FetchRandom(100, () => p);

            expect(random.between(0, 100000000)).to.equal(33906440);

            await trigger();

            expect(random.between(0, 100000000)).to.equal(64812794);
        });

        it('should call the fetch function when the refreshAt count is reached', async () => {
            let trigger = async () => {};
            let callCount = 0;

            const fetchFunction = () => {
                callCount++;
                const { p, trigger: triggerFunc } = resolveOnTrigger([936]);
                trigger = triggerFunc;
                return p;
            };

            const random = new FetchRandom(100, fetchFunction, 2);

            expect(callCount).to.equal(1);  // invoked on init

            random.between(0, 100000000);
            random.between(0, 100000000);

            expect(callCount).to.equal(1);  // not yet necessary to refresh

            random.between(0, 100000000);

            expect(callCount).to.equal(2);

            await trigger();

            expect(random.between(0, 100000000)).to.equal(64812794);

        });

    });

});
