import expect from 'must';
import { Kind } from '../../src/checker';
import { Evaluator, Result } from '../../src/evaluator';
import { Location, number } from '../../src/types';
import { parse } from '../../src/parser';

function loc(start: number, end: number): Location {
    return {
        start: { line: 1, offset: start, column: start + 1 },
        end: { line: 1, offset: end, column: end + 1 },
    };
}

describe('evaluator', () => {

    describe('evaluateNumber', () => {
        it('should return a result containing that number', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(number(3)).value).to.eql(3);
        });

        it('should return a result with a number kind', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(number(3)).kind).to.eql(Kind.number);
        });

        it('should return an evaluation tree', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(number(3)).tree).to.eql({
                nodeKind: 'number',
                loc: loc(0, 0),
                value: 3,
            });
        });
    });

    describe('evaluate dice group', () => {
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
    });

});
