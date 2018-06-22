import expect from 'must';

import { Kind } from '../../../src/checker';
import { Evaluator, Result } from '../../../src/evaluator';
import { parse } from '../../../src/parser';
import { loc } from '../../ignore-loc.util';

describe('evaluator/binop', () => {

    describe('basic number operations', () => {

        it('should return the addition of two numbers', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('3 + 3'))).to.eql(new Result(6, Kind.number, {
                nodeKind: 'binExpression', loc: loc(0, 5),
                value: 6,
                op: '+',
                lhs: evl.evaluate(parse('3')).tree,
                rhs: evl.evaluate(parse('    3')).tree,
            }));
        });

        it('should return the subtraction of two numbers', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('3-3'))).to.eql(new Result(0, Kind.number, {
                nodeKind: 'binExpression', loc: loc(0, 3),
                value: 0,
                op: '-',
                lhs: evl.evaluate(parse('3')).tree,
                rhs: evl.evaluate(parse('  3')).tree,
            }));
        });

        it('should return the multiplication of two numbers', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('3*3'))).to.eql(new Result(9, Kind.number, {
                nodeKind: 'binExpression', loc: loc(0, 3),
                value: 9,
                op: '*',
                lhs: evl.evaluate(parse('3')).tree,
                rhs: evl.evaluate(parse('  3')).tree,
            }));
        });

        it('should return the division of two numbers', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('3/3'))).to.eql(new Result(1, Kind.number, {
                nodeKind: 'binExpression', loc: loc(0, 3),
                value: 1,
                op: '/',
                lhs: evl.evaluate(parse('3')).tree,
                rhs: evl.evaluate(parse('  3')).tree,
            }));
        });

        it('should return the power result of two numbers', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('3**3'))).to.eql(new Result(27, Kind.number, {
                nodeKind: 'binExpression', loc: loc(0, 4),
                value: 27,
                op: '**',
                lhs: evl.evaluate(parse('3')).tree,
                rhs: evl.evaluate(parse('   3')).tree,
            }));
        });

        it('should return the modulus of two numbers', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('5%3'))).to.eql(new Result(2, Kind.number, {
                nodeKind: 'binExpression', loc: loc(0, 3),
                value: 2,
                op: '%',
                lhs: evl.evaluate(parse('5')).tree,
                rhs: evl.evaluate(parse('  3')).tree,
            }));
        });

    });

    describe('operations on success results', () => {

        it('should return the total as a success kind when added to a success result', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('{3, 4}>2 + {3, 1}>2'))).to.eql(new Result(3, Kind.success, {
                nodeKind: 'binExpression', loc: loc(0, 19),
                value: 3,
                op: '+',
                lhs: evl.evaluate(parse('{3, 4}>2')).tree,
                rhs: evl.evaluate(parse('           {3, 1}>2')).tree,
            }));
        });

        it('should return the total as a success kind when a number is added', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('{3, 4}>2 + 2'))).to.eql(new Result(4, Kind.success, {
                nodeKind: 'binExpression', loc: loc(0, 12),
                value: 4,
                op: '+',
                lhs: evl.evaluate(parse('{3, 4}>2')).tree,
                rhs: evl.evaluate(parse('           2')).tree,
            }));
        });

        it('should return the total as a success kind when added to a number', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(parse('2 + {3, 4}>2'))).to.eql(new Result(4, Kind.success, {
                nodeKind: 'binExpression', loc: loc(0, 12),
                value: 4,
                op: '+',
                lhs: evl.evaluate(parse('2')).tree,
                rhs: evl.evaluate(parse('    {3, 4}>2')).tree,
            }));
        });

    });

    describe('operations on sum results', () => {
        it('should return the total as a sum kind when added to a sum result');
        it('should return the total as a sum kind when added to a number');
        it('should return the total as a sum kind when a number is added');
    })

});
