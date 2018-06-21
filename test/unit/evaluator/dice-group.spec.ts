import expect from 'must';
import { Kind } from '../../../src/checker';
import { Evaluator, Result } from '../../../src/evaluator';
import { parse } from '../../../src/parser';
import { loc } from '../../ignore-loc.util';

describe('evaluator/dice-group', () => {

    describe('sum operation', () => {
        it('should return the sum of all elements', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('{3, 4}'))).to.eql(new Result(7, Kind.sum, {
                nodeKind: 'diceGroup', loc: loc(0, 6),
                value: 7,
                elements: [
                    { expr: evl.evaluate(parse(' 3')).tree, success: 0, dropped: false },
                    { expr: evl.evaluate(parse('    4')).tree, success: 0, dropped: false },
                ],
                modifiers: {},
            }));
        });
    });

    describe('keep and drop', () => {

        it('should keep the highest elements', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('{2, 4}k1'))).to.eql(new Result(4, Kind.sum, {
                nodeKind: 'diceGroup', loc: loc(0, 8),
                value: 4,
                elements: [
                    { expr: evl.evaluate(parse(' 2')).tree, success: 0, dropped: true },
                    { expr: evl.evaluate(parse('    4')).tree, success: 0, dropped: false },
                ],
                modifiers: {
                    keep: { direction: 'h', number: 1 },
                },
            }));
        });

        it('should drop the lowest elements', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('{1, 4, 3, 6}d2'))).to.eql(new Result(10, Kind.sum, {
                nodeKind: 'diceGroup', loc: loc(0, 14),
                value: 10,
                elements: [
                    { expr: evl.evaluate(parse(' 1')).tree, success: 0, dropped: true },
                    { expr: evl.evaluate(parse('    4')).tree, success: 0, dropped: false },
                    { expr: evl.evaluate(parse('       3')).tree, success: 0, dropped: true },
                    { expr: evl.evaluate(parse('          6')).tree, success: 0, dropped: false },
                ],
                modifiers: {
                    drop: { direction: 'l', number: 2 },
                },
            }));
        });

        it('should drop the highest elements', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('{1, 4, 3, 6}dh2'))).to.eql(new Result(4, Kind.sum, {
                nodeKind: 'diceGroup', loc: loc(0, 15),
                value: 4,
                elements: [
                    { expr: evl.evaluate(parse(' 1')).tree, success: 0, dropped: false },
                    { expr: evl.evaluate(parse('    4')).tree, success: 0, dropped: true },
                    { expr: evl.evaluate(parse('       3')).tree, success: 0, dropped: false },
                    { expr: evl.evaluate(parse('          6')).tree, success: 0, dropped: true },
                ],
                modifiers: {
                    drop: { direction: 'h', number: 2 },
                },
            }));
        });

        it('should keep the lowest elements', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('{1, 4, 3, 6}kl2'))).to.eql(new Result(4, Kind.sum, {
                nodeKind: 'diceGroup', loc: loc(0, 15),
                value: 4,
                elements: [
                    { expr: evl.evaluate(parse(' 1')).tree, success: 0, dropped: false },
                    { expr: evl.evaluate(parse('    4')).tree, success: 0, dropped: true },
                    { expr: evl.evaluate(parse('       3')).tree, success: 0, dropped: false },
                    { expr: evl.evaluate(parse('          6')).tree, success: 0, dropped: true },
                ],
                modifiers: {
                    keep: { direction: 'l', number: 2 },
                },
            }));
        });

    });

    describe('success and failure', () => {

        it('should return the number of successes if success modifier used', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('{1, 4, 3, 6}>2'))).to.eql(new Result(3, Kind.success, {
                nodeKind: 'diceGroup', loc: loc(0, 14),
                value: 3,
                elements: [
                    { expr: evl.evaluate(parse(' 1')).tree, success: 0, dropped: false },
                    { expr: evl.evaluate(parse('    4')).tree, success: 1, dropped: false },
                    { expr: evl.evaluate(parse('       3')).tree, success: 1, dropped: false },
                    { expr: evl.evaluate(parse('          6')).tree, success: 1, dropped: false },
                ],
                modifiers: {
                    success: { number: 2, op: '>' },
                },
            }));
        });

        it('should subtract the number of failures if the failure modifier used', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('{1, 4, 3, 6}>2f<2'))).to.eql(new Result(2, Kind.success, {
                nodeKind: 'diceGroup', loc: loc(0, 17),
                value: 2,
                elements: [
                    { expr: evl.evaluate(parse(' 1')).tree, success: -1, dropped: false },
                    { expr: evl.evaluate(parse('    4')).tree, success: 1, dropped: false },
                    { expr: evl.evaluate(parse('       3')).tree, success: 1, dropped: false },
                    { expr: evl.evaluate(parse('          6')).tree, success: 1, dropped: false },
                ],
                modifiers: {
                    success: { number: 2, op: '>' },
                    failure: { number: 2, op: '<' },
                },
            }));
        });

        it('successes should override failures', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('{1, 4, 3, 6}>2f<5'))).to.eql(new Result(2, Kind.success, {
                nodeKind: 'diceGroup', loc: loc(0, 17),
                value: 2,
                elements: [
                    { expr: evl.evaluate(parse(' 1')).tree, success: -1, dropped: false },
                    { expr: evl.evaluate(parse('    4')).tree, success: 1, dropped: false },
                    { expr: evl.evaluate(parse('       3')).tree, success: 1, dropped: false },
                    { expr: evl.evaluate(parse('          6')).tree, success: 1, dropped: false },
                ],
                modifiers: {
                    success: { number: 2, op: '>' },
                    failure: { number: 5, op: '<' },
                },
            }));
        });

        it('should only count successes that have not been dropped', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('{1, 4, 3, 6}>2d2'))).to.eql(new Result(2, Kind.success, {
                nodeKind: 'diceGroup', loc: loc(0, 16),
                value: 2,
                elements: [
                    { expr: evl.evaluate(parse(' 1')).tree, success: 0, dropped: true },
                    { expr: evl.evaluate(parse('    4')).tree, success: 1, dropped: false },
                    { expr: evl.evaluate(parse('       3')).tree, success: 1, dropped: true },
                    { expr: evl.evaluate(parse('          6')).tree, success: 1, dropped: false },
                ],
                modifiers: {
                    success: { number: 2, op: '>' },
                    drop: { number: 2, direction: 'l' },
                },
            }));
        });

        it('should count successes using = operator', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('{1, 4, 3, 6}=6'))).to.eql(new Result(1, Kind.success, {
                nodeKind: 'diceGroup', loc: loc(0, 14),
                value: 1,
                elements: [
                    { expr: evl.evaluate(parse(' 1')).tree, success: 0, dropped: false },
                    { expr: evl.evaluate(parse('    4')).tree, success: 0, dropped: false },
                    { expr: evl.evaluate(parse('       3')).tree, success: 0, dropped: false },
                    { expr: evl.evaluate(parse('          6')).tree, success: 1, dropped: false },
                ],
                modifiers: {
                    success: { number: 6, op: '=' },
                },
            }))
        })

    });

});
