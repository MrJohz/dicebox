import expect from 'must';

import { Kind } from '../../../src/checker';
import { Evaluator, Result } from '../../../src/evaluator';
import { parse } from '../../../src/parser';
import { loc } from '../../ignore-loc.util';

describe('evaluator/func', () => {

    describe('ceil', () => {

        it('should round up numbers greater than .5', () => {
            const evl = new Evaluator();

            expect(evl.evaluate(parse('ceil(3.8)'))).to.eql(new Result(4, Kind.number, {
                nodeKind: 'funcExpression', loc: loc(0, 9),
                value: 4,
                arg: evl.evaluate(parse('     3.8')).tree,
                funcName: 'ceil',
            }));
        });

        it('should round up numbers less than .5', () => {
            const evl = new Evaluator();

            expect(evl.evaluate(parse('ceil(3.2)'))).to.eql(new Result(4, Kind.number, {
                nodeKind: 'funcExpression', loc: loc(0, 9),
                value: 4,
                arg: evl.evaluate(parse('     3.2')).tree,
                funcName: 'ceil',
            }));
        });

        it('should round up negative numbers', () => {
            const evl = new Evaluator();

            expect(evl.evaluate(parse('ceil(-3.5)'))).to.eql(new Result(-3, Kind.number, {
                nodeKind: 'funcExpression', loc: loc(0, 10),
                value: -3,
                arg: evl.evaluate(parse('     -3.5')).tree,
                funcName: 'ceil',
            }));
        });

    });

    describe('abs', () => {

        it('should return a positive number when passed a positive number', () => {
            const evl = new Evaluator();

            expect(evl.evaluate(parse('abs(3.8)'))).to.eql(new Result(3.8, Kind.number, {
                nodeKind: 'funcExpression', loc: loc(0, 8),
                value: 3.8,
                arg: evl.evaluate(parse('    3.8')).tree,
                funcName: 'abs',
            }));
        });

        it('should return a positive number when passed a negative number', () => {
            const evl = new Evaluator();

            expect(evl.evaluate(parse('abs(-3.8)'))).to.eql(new Result(3.8, Kind.number, {
                nodeKind: 'funcExpression', loc: loc(0, 9),
                value: 3.8,
                arg: evl.evaluate(parse('    -3.8')).tree,
                funcName: 'abs',
            }));
        });

    });

    describe('floor', () => {

        it('should round down numbers greater than .5', () => {
            const evl = new Evaluator();

            expect(evl.evaluate(parse('floor(3.8)'))).to.eql(new Result(3, Kind.number, {
                nodeKind: 'funcExpression', loc: loc(0, 10),
                value: 3,
                arg: evl.evaluate(parse('      3.8')).tree,
                funcName: 'floor',
            }));
        });

        it('should round down numbers less than .5', () => {
            const evl = new Evaluator();

            expect(evl.evaluate(parse('floor(3.2)'))).to.eql(new Result(3, Kind.number, {
                nodeKind: 'funcExpression', loc: loc(0, 10),
                value: 3,
                arg: evl.evaluate(parse('      3.2')).tree,
                funcName: 'floor',
            }));
        });

        it('should round down negative numbers', () => {
            const evl = new Evaluator();

            expect(evl.evaluate(parse('floor(-3.5)'))).to.eql(new Result(-4, Kind.number, {
                nodeKind: 'funcExpression', loc: loc(0, 11),
                value: -4,
                arg: evl.evaluate(parse('      -3.5')).tree,
                funcName: 'floor',
            }));
        });

    });

    describe('round', () => {

        it('should round up numbers greater than .5', () => {
            const evl = new Evaluator();

            expect(evl.evaluate(parse('round(3.8)'))).to.eql(new Result(4, Kind.number, {
                nodeKind: 'funcExpression', loc: loc(0, 10),
                value: 4,
                arg: evl.evaluate(parse('      3.8')).tree,
                funcName: 'round',
            }));
        });

        it('should round down numbers less than .5', () => {
            const evl = new Evaluator();

            expect(evl.evaluate(parse('round(3.2)'))).to.eql(new Result(3, Kind.number, {
                nodeKind: 'funcExpression', loc: loc(0, 10),
                value: 3,
                arg: evl.evaluate(parse('      3.2')).tree,
                funcName: 'round',
            }));
        });

        it('should round up negative numbers gte 0.5', () => {
            const evl = new Evaluator();

            expect(evl.evaluate(parse('round(-3.5)'))).to.eql(new Result(-3, Kind.number, {
                nodeKind: 'funcExpression', loc: loc(0, 11),
                value: -3,
                arg: evl.evaluate(parse('      -3.5')).tree,
                funcName: 'round',
            }));
        });

    });

});
