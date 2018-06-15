import expect from 'must';
import { check, Kind } from '../../src/checker';
import { parse } from '../../src/parser';
import { binExpression, Location, number } from '../../src/types';

function loc(start: number, end: number): Location {
    return {
        start: { line: 1, offset: start, column: start + 1 },
        end: { line: 1, offset: end, column: end + 1 },
    };
}

describe('checker', () => {

    describe('check numbers', () => {
        it('should always succeed w/ kind number', () => {
            expect(check(number(3))).to.eql({ success: true, kind: Kind.number });
            expect(check(number(3e9))).to.eql({ success: true, kind: Kind.number });
            expect(check(number(3.2))).to.eql({ success: true, kind: Kind.number });
        });
    });

    describe('check dice', () => {
        it('it should return sum kind if no success modifier present', () => {
            expect(check(parse('3d6'))).to.eql({ success: true, kind: Kind.sum });
        });

        it('should return success kind if a success modifier is present', () => {
            expect(check(parse('3d6>3'))).to.eql({ success: true, kind: Kind.success });
            expect(check(parse('3d6>3f1'))).to.eql({ success: true, kind: Kind.success });
        });
    });

    describe('check binary expressions', () => {
        it('should return sum kind if both children are dice w/o success modifier', () => {
            expect(check(parse('3d6 + 2d8'))).to.eql({ success: true, kind: Kind.sum });
        });

        it('should return number kind if both children are numbers', () => {
            expect(check(parse('3 + 2'))).to.eql({ success: true, kind: Kind.number });
        });

        it('should return success kind if both children are dice w/ success modifier', () => {
            expect(check(parse('3d6>2 + 5d7>3'))).to.eql({ success: true, kind: Kind.success });
        });

        it('should return sum kind if applying a number to a sum dice', () => {
            expect(check(parse('3d6 + 5'))).to.eql({ success: true, kind: Kind.sum });
            expect(check(parse('5 + 3d6'))).to.eql({ success: true, kind: Kind.sum });
        });

        it('should return success kind if applying a number to a success dice', () => {
            expect(check(parse('8 * 8d8>3'))).to.eql({ success: true, kind: Kind.success });
            expect(check(parse('3d6>2 * 8'))).to.eql({ success: true, kind: Kind.success });
        });

        it('should return failure if one child is a failure', () => {
            const failureChild = parse('d1>1 + d1');
            const failCheck = check(failureChild);
            if (failCheck.success) throw new Error('failing child should not succeed');

            expect(check(binExpression({
                op: '+',
                lhs: failureChild,
                rhs: parse('3'),
            }))).to.eql({
                success: false,
                errors: failCheck.errors,
            });
        });

        it('should return failure if both children are failures', () => {
            const failureChild1 = parse('d1>1 + d1');
            const failCheck1 = check(failureChild1);
            if (failCheck1.success) throw new Error('failing child should not succeed');

            const failureChild2 = parse('d11 + d1>1');
            const failCheck2 = check(failureChild2);
            if (failCheck2.success) throw new Error('failing child should not succeed');

            expect(check(binExpression({
                op: '+',
                lhs: failureChild1,
                rhs: failureChild2,
            }))).to.eql({
                success: false,
                errors: [...failCheck1.errors, ...failCheck2.errors],
            });
        });

        it('should return failure if applying a success dice to a sum dice', () => {
            expect(check(parse('8d8>3 + 2d6'))).to.eql({
                success: false, errors: [{
                    type: 'BINOP_INCOMPATIBLE_KINDS',
                    message: `cannot add kinds 'success' and 'sum'`,
                    loc: loc(0, 11),
                }],
            });
        });

        it('should return failure if a nested expression adds two different types', () => {
            expect(check(binExpression({
                loc: loc(1, 3),
                op: '-',
                lhs: parse('3 + 3d5'),  // sum dice
                rhs: parse('3d4>7 + 4d6>8'), // success dice
            }))).to.eql({
                success: false, errors: [{
                    type: 'BINOP_INCOMPATIBLE_KINDS',
                    message: `cannot subtract kinds 'sum' and 'success'`,
                    loc: loc(1, 3),
                }],
            });
        });
    });

    describe('check dice groups', () => {

        it('should have accept all sum kinds as a sum kind', () => {
            expect(check(parse('{4d6, 4d6, 4d2}'))).to.eql({
                success: true, kind: Kind.sum,
            });
        });

        it('should have accept all number kinds as a number kind', () => {
            expect(check(parse('{4, 5, 3}'))).to.eql({
                success: true, kind: Kind.number,
            });
        });

        it('should have accept all success kinds as a success kind', () => {
            expect(check(parse('{4d6>1, 4d6>1, 4d2>1}'))).to.eql({
                success: true, kind: Kind.success,
            });
        });

        it('should combine errors from all child errors', () => {
            expect(check(parse('{ 3d6 + 3d8>2, 3d7 + 2d1>3 }'))).to.eql({
                success: false, errors: [
                    {
                        type: 'BINOP_INCOMPATIBLE_KINDS',
                        message: `cannot add kinds 'sum' and 'success'`,
                        loc: loc(2, 13),
                    },
                    {
                        type: 'BINOP_INCOMPATIBLE_KINDS',
                        message: `cannot add kinds 'sum' and 'success'`,
                        loc: loc(15, 26),
                    },
                ],
            });
        });

        it('should return an error if any element is different', () => {
            expect(check(parse('{ 3d6, 4d8>2 }'))).to.eql({
                success: false, errors: [
                    {
                        type: 'GROUP_INCOMPATIBLE_KINDS',
                        message: `cannot mix kinds 'sum' and 'success'`,
                        loc: loc(7, 12),
                    },
                ],
            });
        });

        it('should return an error for each different element', () => {
            expect(check(parse('{ 3d6, 4d8>1, 4d5, 4 }'))).to.eql({
                success: false, errors: [
                    {
                        type: 'GROUP_INCOMPATIBLE_KINDS',
                        message: `cannot mix kinds 'sum' and 'success'`,
                        loc: loc(7, 12),
                    },
                    {
                        type: 'GROUP_INCOMPATIBLE_KINDS',
                        message: `cannot mix kinds 'sum' and 'number'`,
                        loc: loc(19, 20),
                    },
                ],
            });
        });

    });

});
