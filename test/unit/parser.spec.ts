import expect from 'must';
import { parse } from '../../src/parser';
import { dice, number, binExpression } from '../../src/types';

describe('parse', () => {

    describe('dice', () => {

        it(`should return a single n-sided dice when passed 'dN'`, () => {
            expect(parse('d6')).to.eql(dice({ noDice: 1, diceSides: [1, 2, 3, 4, 5, 6] }));
        });

        it(`should return N M-sided dice when passed 'NdM'`, () => {
            expect(parse('3d4')).to.eql(dice({ noDice: 3, diceSides: [1, 2, 3, 4] }));
        });

        it(`should return 0 N-sided dice when passed '0dN'`, () => {
            expect(parse('0d5')).to.eql(dice({ noDice: 0, diceSides: [1, 2, 3, 4, 5] }));
        });

        it(`should return N fate dice when passed 'NdF'`, () => {
            expect(parse('3dF')).to.eql(dice({ noDice: 3, diceSides: [-1, 0, 1] }));
        });

    });

    describe('numbers', () => {

        it(`should return the number N when passed 'N'`, () => {
            expect(parse('14')).to.eql(number({ value: 14 }));
        });

        it(`should handle numbers with fractional parts`, () => {
            expect(parse('14.32')).to.eql(number({ value: 14.32 }));
        });

        it(`should handle numbers with only fractional parts`, () => {
            expect(parse('.43')).to.eql(number({ value: .43 }));
        });

        it(`should handle integers with exponential parts`, () => {
            expect(parse('14e5')).to.eql(number({ value: 14e5 }));
        });

        it(`should handle fractions with exponential parts`, () => {
            expect(parse('14.4e4')).to.eql(number({ value: 14.4e4 }));
        });

    });

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

        it.skip(`should have the correct precedence of all binary operators`, () => {
            expect(parse('4 + 3 ** 2 * 5')).to.eql(binExpression({
                op: '+',
                lhs: number(4),
                rhs: binExpression({
                    op: '*',
                    lhs: number(3),
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
                rhs: number(5),
            }));
        })

    });

});
