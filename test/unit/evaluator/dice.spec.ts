import expect from 'must';

import { Kind } from '../../../src/checker';
import { Evaluator, Result, RollSuccess } from '../../../src/evaluator';
import { parse } from '../../../src/parser';
import { SeededRandom } from '../../../src/random';
import { diceSidesOf } from '../../../src/utils';
import { loc } from '../../ignore-loc.util';

describe('evaluator/dice', () => {

    describe('evaluate simple dice', () => {

        it('should return the rolled result when a dice is rolled', () => {
            const evl = new Evaluator(new SeededRandom(0));

            expect(evl.evaluate(parse('d8'))).to.eql(new Result(5, Kind.sum, {
                nodeKind: 'dice',
                diceSides: diceSidesOf(8),
                noDice: 1,
                loc: loc(0, 2),
                value: 5,
                rolls: [
                    { value: 5, dropped: false, success: RollSuccess.ignored },
                ],
            }));
        });

        it('should roll one dice for each dice listed', () => {
            const evl = new Evaluator(new SeededRandom(0));

            expect(evl.evaluate(parse('3d8'))).to.eql(new Result(19, Kind.sum, {
                nodeKind: 'dice', loc: loc(0, 3),
                diceSides: diceSidesOf(8),
                noDice: 3,
                value: 19,
                rolls: [
                    { value: 5, dropped: false, success: RollSuccess.ignored },
                    { value: 8, dropped: false, success: RollSuccess.ignored },
                    { value: 6, dropped: false, success: RollSuccess.ignored },
                ],
            }));
        });

        it('should roll a fate dice when passed a NdF expression', () => {
            const evl = new Evaluator(new SeededRandom(0));

            expect(evl.evaluate(parse('8dF'))).to.eql(new Result(-1, Kind.sum, {
                nodeKind: 'dice', loc: loc(0, 3),
                diceSides: diceSidesOf('F'),
                noDice: 8,
                value: -1,
                rolls: [
                    { value: 1, dropped: false, success: RollSuccess.ignored },
                    { value: -1, dropped: false, success: RollSuccess.ignored },
                    { value: 1, dropped: false, success: RollSuccess.ignored },
                    { value: -1, dropped: false, success: RollSuccess.ignored },
                    { value: 0, dropped: false, success: RollSuccess.ignored },
                    { value: -1, dropped: false, success: RollSuccess.ignored },
                    { value: 0, dropped: false, success: RollSuccess.ignored },
                    { value: 0, dropped: false, success: RollSuccess.ignored },
                ],
            }));
        });
    });

    describe('computed dice', () => {

        it('should roll a dynamic number of dice when passed a computed dice expression', () => {
            const evl = new Evaluator(new SeededRandom(0));

            expect(evl.evaluate(parse('(d8)d8'))).to.eql(new Result(23, Kind.sum, {
                nodeKind: 'dice', loc: loc(0, 6),
                diceSides: diceSidesOf(8),
                noDice: {
                    nodeKind: 'dice', loc: loc(1, 3),
                    noDice: 1, diceSides: diceSidesOf(8),
                    value: 5,
                    rolls: [{ value: 5, dropped: false, success: RollSuccess.ignored }],
                },
                value: 23,
                rolls: [
                    { value: 8, dropped: false, success: RollSuccess.ignored },
                    { value: 6, dropped: false, success: RollSuccess.ignored },
                    { value: 1, dropped: false, success: RollSuccess.ignored },
                    { value: 4, dropped: false, success: RollSuccess.ignored },
                    { value: 4, dropped: false, success: RollSuccess.ignored },
                ],
            }));
        });

        it('should roll a dynamically-sided dice when passed a computed dice expression', () => {
            const evl = new Evaluator(new SeededRandom(0));

            expect(evl.evaluate(parse('8d(d8)'))).to.eql(new Result(29, Kind.sum, {
                nodeKind: 'dice', loc: loc(0, 6),
                noDice: 8,
                diceSides: {
                    nodeKind: 'dice', loc: loc(3, 5),
                    noDice: 1, diceSides: diceSidesOf(8),
                    value: 5,
                    rolls: [{ value: 5, dropped: false, success: RollSuccess.ignored }],
                },
                value: 29,
                rolls: [
                    { value: 5, dropped: false, success: RollSuccess.ignored },
                    { value: 4, dropped: false, success: RollSuccess.ignored },
                    { value: 1, dropped: false, success: RollSuccess.ignored },
                    { value: 4, dropped: false, success: RollSuccess.ignored },
                    { value: 5, dropped: false, success: RollSuccess.ignored },
                    { value: 3, dropped: false, success: RollSuccess.ignored },
                    { value: 4, dropped: false, success: RollSuccess.ignored },
                    { value: 3, dropped: false, success: RollSuccess.ignored },
                ],
            }));
        });

    });

});
