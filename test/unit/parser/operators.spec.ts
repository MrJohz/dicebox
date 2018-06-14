import expect from 'must';

import { parse } from '../../../src/parser';
import { binExpression, number, funcExpression } from '../../../src/types';

describe('parser', () => {

    describe('binary operators', () => {

        it(`should return an expression summing two numbers when passed N + M`, () => {
            expect(parse('4 + 3')).to.eql(binExpression({ op: '+', lhs: number(4), rhs: number(3) }));
        });

        it(`should return an expression subtracting a dice from a number when passed D - K`, () => {
            expect(parse('4 - 3d5')).to.eql(binExpression({ op: '-', lhs: number(4), rhs: parse('3d5') }));
        });

        it(`should return a nested tree when passed multiple additions and subtractions`, () => {
            expect(parse('4 + 3 - 2 + 8 + 2d8')).to.eql(binExpression({
                op: '+',
                lhs: binExpression({
                    op: '+',
                    lhs: binExpression({
                        op: '-',
                        lhs: binExpression({
                            op: '+',
                            lhs: number(4),
                            rhs: number(3),
                        }),
                        rhs: number(2),
                    }),
                    rhs: number(8),
                }),
                rhs: parse('2d8'),
            }));
        });

        it(`should return a multiplication expression when passed N * M`, () => {
            expect(parse('4 * 3')).to.eql(binExpression({ op: '*', lhs: number(4), rhs: number(3) }));
        });

        it(`should return a division expression when passed N / M`, () => {
            expect(parse('4 / 3')).to.eql(binExpression({ op: '/', lhs: number(4), rhs: number(3) }));
        });

        it(`should have correct precedence of addition/subtraction over mult/division`, () => {
            expect(parse('4 + 3 * 5')).to.eql(binExpression({
                op: '+',
                lhs: number(4),
                rhs: binExpression({
                    op: '*',
                    lhs: number(3),
                    rhs: number(5),
                }),
            }));

            expect(parse('4 * 3 + 5')).to.eql(binExpression({
                op: '+',
                lhs: binExpression({
                    op: '*',
                    lhs: number(4),
                    rhs: number(3),
                }),
                rhs: number(5),
            }));
        });

        it(`should support raising to powers`, () => {
            expect(parse('4 ** 3')).to.eql(binExpression({
                op: '**',
                lhs: number(4),
                rhs: number(3),
            }));
        });

        it(`should have the correct precedence of all binary operators`, () => {
            expect(parse('4 + 3 ** 2 * 5')).to.eql(binExpression({
                op: '+',
                lhs: number(4),
                rhs: binExpression({
                    op: '*',
                    lhs: binExpression({
                        op: '**',
                        lhs: number(3),
                        rhs: number(2),
                    }),
                    rhs: number(5),
                }),
            }));

            expect(parse('4 * 3 + 5 ** 2')).to.eql(binExpression({
                op: '+',
                lhs: binExpression({
                    op: '*',
                    lhs: number(4),
                    rhs: number(3),
                }),
                rhs: binExpression({
                    op: '**',
                    lhs: number(5),
                    rhs: number(2),
                }),
            }));
        });

        it(`should allow arbitrary whitespace around all binary operators`, () => {
            expect(parse('4+ 5     +     7')).to.eql(binExpression({
                op: '+',
                lhs: binExpression({
                    op: '+',
                    lhs: number(4),
                    rhs: number(5),
                }),
                rhs: number(7),
            }));
        });

        it(`should support the modulus operator`, () => {
            expect(parse('4 % 5 + 7')).to.eql(binExpression({
                op: '+',
                lhs: binExpression({
                    op: '%',
                    lhs: number(4),
                    rhs: number(5),
                }),
                rhs: number(7),
            }));
        });

    });

    describe('brackets', () => {

        it('should pass the child expression directly when passed (N)', () => {
            expect(parse('(3)')).to.eql(number(3));
        });

        it('should handle arbitrary (balanced) parentheses', () => {
            expect(parse('((((3))))')).to.eql(number(3));
        });

        it('should fail if parentheses are unbalanced', () => {
            expect(() => parse('(((3)')).to.throw();
            expect(() => parse('(3)))')).to.throw();
        });

        it('should affect the normal precedence order', () => {
            expect(parse('(3 + 4) * 5')).to.eql(binExpression({
                op: '*',
                lhs: binExpression({
                    op: '+',
                    lhs: number(3),
                    rhs: number(4),
                }),
                rhs: number(5),
            }));

            expect(parse('3 + (4 * 5)')).to.eql(binExpression({
                op: '+',
                lhs: number(3),
                rhs: binExpression({
                    op: '*',
                    lhs: number(4),
                    rhs: number(5),
                }),
            }));
        });

        it('should allow arbitrary space around and between the parentheses', () => {
            expect(parse('(3 ) +   (   4 )  ')).to.eql(binExpression({
                op: '+',
                lhs: number(3),
                rhs: number(4),
            }));
        });

    });

    describe('functions', () => {
        it('should return a function node when passed func(N)', () => {
            expect(parse('floor(3.6)')).to.eql(funcExpression({ func: 'floor', arg: number(3.6) }));
        });

        it('should allow whitespace between brackets', () => {
            expect(parse('ciel(   4.8   )')).to.eql(funcExpression({ func: 'ciel', arg: number(4.8) }));
        });

        it('should not allow space between function name and brackets', () => {
            expect(() => parse('round (3)')).to.throw();
        });
    });

});
