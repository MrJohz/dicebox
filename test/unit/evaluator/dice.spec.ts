import expect from 'must';

import { Kind } from '../../../src/checker';
import { RollCrit, RollStatus, Evaluator, Result, RollSuccess } from '../../../src/evaluator';
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
                    { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
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
                    { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
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
                    { value: 1, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: -1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 1, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: -1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 0, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: -1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 0, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 0, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
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
                    rolls: [{ value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored }],
                },
                value: 23,
                rolls: [
                    { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
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
                    rolls: [{ value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored }],
                },
                value: 29,
                rolls: [
                    { value: 5, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 5, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 3, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    { value: 3, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                ],
            }));
        });

    });

    describe('modifiers', () => {

        describe('exploding', () => {

            it('should explode dice when passed the exploding dice modifier', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('3d8!'))).to.eql(new Result(20, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 4),
                    noDice: 3, diceSides: diceSidesOf(8),
                    value: 20,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        [
                            { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                        { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should explode on arbitrary compare points', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('3d8!>4'))).to.eql(new Result(28, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 6),
                    noDice: 3, diceSides: diceSidesOf(8),
                    value: 28,
                    rolls: [
                        [
                            { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should ignore rerolled dice', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('3d8!>4r>5'))).to.eql(new Result(14, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 9),
                    noDice: 3, diceSides: diceSidesOf(8),
                    value: 14,
                    rolls: [
                        [
                            { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 8, crit: RollCrit.MAX, status: RollStatus.rerolled, success: RollSuccess.ignored },
                            { value: 6, crit: null, status: RollStatus.rerolled, success: RollSuccess.ignored },
                            { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

        });

        describe('compounding', () => {

            it('should roll a compounding dice and add all the numbers together', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('3d8!!'))).to.eql(new Result(20, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 5),
                    noDice: 3, diceSides: diceSidesOf(8),
                    value: 20,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 14, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should roll a penetrating dice on any arbitrary compare point', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('3d8!!>4'))).to.eql(new Result(28, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 7),
                    noDice: 3, diceSides: diceSidesOf(8),
                    value: 28,
                    rolls: [
                        { value: 20, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should not run compounding if exploding has already run', () => {
                let evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('3d8!!>4!>4'))).to.eql(new Result(28, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 10),
                    noDice: 3, diceSides: diceSidesOf(8),
                    value: 28,
                    rolls: [
                        [
                            { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));

                evl = new Evaluator(new SeededRandom(0));  // reset seed

                expect(evl.evaluate(parse('3d8!>4!!>4'))).to.eql(new Result(28, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 10),
                    noDice: 3, diceSides: diceSidesOf(8),
                    value: 28,
                    rolls: [
                        [
                            { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should ignore rerolled dice', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('3d8!!>4r>5'))).to.eql(new Result(14, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 10),
                    noDice: 3, diceSides: diceSidesOf(8),
                    value: 14,
                    rolls: [
                        { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

        });

        describe('penetrating', () => {

            it('should return the same as exploding, but with -1 modifiers to later rolls', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('3d8!p'))).to.eql(new Result(19, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 5),
                    noDice: 3, diceSides: diceSidesOf(8),
                    value: 19,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        [
                            { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                        { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should roll penetrating dice on arbitrary compare points', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('3d8!p>4'))).to.eql(new Result(25, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 7),
                    noDice: 3, diceSides: diceSidesOf(8),
                    value: 25,
                    rolls: [
                        [
                            { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 7, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 0, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));

            });

            it('should ignore rerolled dice', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('3d8!p>4r>5'))).to.eql(new Result(13, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 10),
                    noDice: 3, diceSides: diceSidesOf(8),
                    value: 13,
                    rolls: [
                        [
                            { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 7, crit: RollCrit.MAX, status: RollStatus.rerolled, success: RollSuccess.ignored },
                            { value: 5, crit: null, status: RollStatus.rerolled, success: RollSuccess.ignored },
                            { value: 0, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

        });

        describe('keep', () => {

            it('should only keep the best values from a range of dice', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('5d8k2'))).to.eql(new Result(14, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 5),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 14,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 1, crit: RollCrit.MIN, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                    ],
                }));
            });

            it(`should keep the worst values from a range of dice if 'l' passed`, () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('5d8kl2'))).to.eql(new Result(5, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 6),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 5,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 8, crit: RollCrit.MAX, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 6, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should keep the best individual values from exploded dice', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('5d8!k3'))).to.eql(new Result(19, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 6),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 19,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        [
                            { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                        { value: 1, crit: RollCrit.MIN, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should ignore rerolled dice', () => {
                const evl = new Evaluator(new SeededRandom(0));

                // 5d8, reroll 1s, keep lowest die
                expect(evl.evaluate(parse('5d8rkl1'))).to.eql(new Result(4, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 7),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 4,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 8, crit: RollCrit.MAX, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 6, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                        [
                            { value: 1, crit: RollCrit.MIN, status: RollStatus.rerolled, success: RollSuccess.ignored },
                            { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                        { value: 4, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                    ],
                }));
            });

        });

        describe('drop', () => {

            it('should drop the worst values from a range of dice', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('5d8d2'))).to.eql(new Result(19, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 5),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 19,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 1, crit: RollCrit.MIN, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                    ],
                }));
            });

            it(`should drop the best values from a range of dice if 'h' passed`, () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('5d8dh2'))).to.eql(new Result(10, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 6),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 10,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 8, crit: RollCrit.MAX, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 6, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should drop the worst individual values from exploded dice', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('5d8!d2'))).to.eql(new Result(23, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 6),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 23,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        [
                            { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                            { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                        { value: 1, crit: RollCrit.MIN, status: RollStatus.dropped, success: RollSuccess.ignored },
                        // NOTE: when two rolls are equal, drop the earliest roll
                        { value: 4, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should ignore rerolled dice', () => {
                const evl = new Evaluator(new SeededRandom(0));

                // 5d8, reroll 1s, drop lowest die
                expect(evl.evaluate(parse('5d8rd1'))).to.eql(new Result(23, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 6),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 23,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        [
                            // do not drop the 1, despite it being the lowest
                            { value: 1, crit: RollCrit.MIN, status: RollStatus.rerolled, success: RollSuccess.ignored },
                            { value: 4, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                        ],
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

        });

        describe('success/failure', () => {

            it('should return success count w/ all successes if result is a success', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('5d8>5'))).to.eql(new Result(2, Kind.success, {
                    nodeKind: 'dice', loc: loc(0, 5),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 2,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.success },
                        { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.success },
                        { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should return success count w/ successes & failures if passed success and failure mods', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('5d8>5f<2'))).to.eql(new Result(1, Kind.success, {
                    nodeKind: 'dice', loc: loc(0, 8),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 1,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.success },
                        { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.success },
                        { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.failure },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should apply successes/failures to exploded dice', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('5d8>5f<2!'))).to.eql(new Result(1, Kind.success, {
                    nodeKind: 'dice', loc: loc(0, 9),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 1,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        [
                            { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.success },
                            { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.success },
                        ],
                        { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.failure },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should apply drops/keeps and successes independently', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('5d8d2>5'))).to.eql(new Result(2, Kind.success, {
                    nodeKind: 'dice', loc: loc(0, 7),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 2,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.success },
                        { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.success },
                        { value: 1, crit: RollCrit.MIN, status: RollStatus.dropped, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.dropped, success: RollSuccess.ignored },
                    ],
                }));
            });

        });

        describe('reroll', () => {

            it('should reroll rolls that match the criteria', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('5d8r'))).to.eql(new Result(27, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 4),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 27,
                    rolls: [
                        { value: 5, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 8, crit: RollCrit.MAX, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 6, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        [
                            { value: 1, crit: RollCrit.MIN, status: RollStatus.rerolled, success: RollSuccess.ignored },
                            { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                    ],
                }));
            });

            it('should check all reroll criteria if multiple are given', () => {
                const evl = new Evaluator(new SeededRandom(0));

                expect(evl.evaluate(parse('5d8r5r8r6'))).to.eql(new Result(15, Kind.sum, {
                    nodeKind: 'dice', loc: loc(0, 9),
                    noDice: 5, diceSides: diceSidesOf(8),
                    value: 15,
                    rolls: [
                        [
                            { value: 5, crit: null, status: RollStatus.rerolled, success: RollSuccess.ignored },
                            { value: 8, crit: RollCrit.MAX, status: RollStatus.rerolled, success: RollSuccess.ignored },
                            { value: 6, crit: null, status: RollStatus.rerolled, success: RollSuccess.ignored },
                            { value: 1, crit: RollCrit.MIN, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        { value: 4, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        [
                            { value: 8, crit: RollCrit.MAX, status: RollStatus.rerolled, success: RollSuccess.ignored },
                            { value: 2, crit: null, status: RollStatus.active, success: RollSuccess.ignored },
                        ],
                    ],
                }));
            });

        });

    });

});
