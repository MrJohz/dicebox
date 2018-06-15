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

});
