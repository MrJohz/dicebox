import expect from 'must';

import { parse } from '../../../src/parser';
import { dice, number, binExpression, DICE_MAX, diceGroup } from '../../../src/types';
import { acceptLoc, ignoreLoc } from '../../ignore-loc.util';

describe('parser/dice', () => {

    beforeEach(() => { ignoreLoc(expect); });
    afterEach(() => { acceptLoc(expect); });

    describe('basic dice', () => {

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

        it(`should accept zero-sided dice`, () => {
            expect(parse('3d0')).to.eql(dice({ noDice: 3, diceSides: [] }));
        });

        it(`should throw when passed a negative number of dice`, () => {
            expect(() => parse('-3dF')).to.throw();
        });

    });

    describe('computed dice', () => {
        it('should return a dice that has a computed dice number when passed (expr)dN', () => {
            expect(parse('(2 + 3)d8')).to.eql(dice({
                noDice: binExpression({
                    op: '+',
                    lhs: number(2),
                    rhs: number(3),
                }),
                diceSides: [1, 2, 3, 4, 5, 6, 7, 8],
            }));
        });

        it('should return a dice that has computer dice sides when passed Nd(expr)', () => {
            expect(parse('8d(2+3)')).to.eql(dice({
                noDice: 8,
                diceSides: binExpression({
                    op: '+',
                    lhs: number(2),
                    rhs: number(3),
                }),
            }));
        });

        it('should not allow whitespace between the expression computation and the dice specifier', () => {
            expect(() => parse('(8) d8')).to.throw();
            expect(() => parse('8d (8)')).to.throw();
        });
    });

    describe('dice modifiers', () => {

        it('should handle success w/o failures', () => {
            expect(parse('3d1>3')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                success: { op: '>', number: 3 },
            }));
        });

        it('should handle success with failures', () => {
            expect(parse('3d1>3f2')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                success: { op: '>', number: 3 },
                failure: { op: '=', number: 2 },
            }));
        });

        it('should not accept failures on their own', () => {
            expect(() => parse('3d1f2')).to.throw();
        });

        it('should handle exploding dice', () => {
            expect(parse('3d8!')).to.eql(dice({
                noDice: 3,
                diceSides: [1, 2, 3, 4, 5, 6, 7, 8],
                exploding: { op: '=', number: DICE_MAX },
            }));
        });

        it('should handle exploding dice with an explicit compare point', () => {
            expect(parse('3d8!<2')).to.eql(dice({
                noDice: 3,
                diceSides: [1, 2, 3, 4, 5, 6, 7, 8],
                exploding: { op: '<', number: 2 },
            }));
        });

        it('should handle exploding dice with a compare point with implicit operator', () => {
            expect(parse('3d8!2')).to.eql(dice({
                noDice: 3,
                diceSides: [1, 2, 3, 4, 5, 6, 7, 8],
                exploding: { op: '=', number: 2 },
            }));
        });

        it('should handle compounding dice', () => {
            expect(parse('3d1!!')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                compounding: { op: '=', number: DICE_MAX },
            }));
        });

        it('should handle penetrating dice', () => {
            expect(parse('3d1!p>3')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                penetrating: { op: '>', number: 3 },
            }));
        });

        it('should handle keeps', () => {
            expect(parse('3d1k2')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                keep: { direction: 'h', number: 2 },
            }));
        });

        it('should handle keeps with explicit direction', () => {
            expect(parse('3d1kh2')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                keep: { direction: 'h', number: 2 },
            }));
            expect(parse('3d1kl2')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                keep: { direction: 'l', number: 2 },
            }));
        });

        it('should handle drops', () => {
            expect(parse('3d1d2')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                drop: { direction: 'l', number: 2 },
            }));
            expect(parse('3d1dh2')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                drop: { direction: 'h', number: 2 },
            }));
            expect(parse('3d1dl2')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                drop: { direction: 'l', number: 2 },
            }));
        });

        it(`should handle 'reroll once'`, () => {
            expect(parse('3d1ro3')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                rerollOnce: { op: '=', number: 3 },
            }));
        });

        it('should handle sorting', () => {
            expect(parse('3d1s')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                sort: { direction: 'a' },
            }));
            expect(parse('3d1sa')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                sort: { direction: 'a' },
            }));
            expect(parse('3d1sd')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                sort: { direction: 'd' },
            }));
        });

        it(`should handle 'reroll many'`, () => {
            expect(parse('3d1r3')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                reroll: [{ op: '=', number: 3 }],
            }));
        });

        it(`should handle multiple 'reroll many'`, () => {
            expect(parse('3d1r4r>3r<5')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                reroll: [
                    { op: '=', number: 4 },
                    { op: '>', number: 3 },
                    { op: '<', number: 5 },
                ],
            }));
        });

        it('should handle multiple consecutive modifers', () => {
            expect(parse('3d1!2!p3')).to.eql(dice({
                noDice: 3,
                diceSides: [1],
                exploding: { op: '=', number: 2 },
                penetrating: { op: '=', number: 3 },
            }));
        });

        it('should handle multiple modifers in any order', () => {
            expect(parse('3d1!2!p3')).to.eql(parse('3d1!p3!2'));
        });

        it('should throw if the same modifier is specified twice', () => {
            expect(() => parse('3d1!2!3')).to.throw();
            expect(() => parse('3d1>3f<2>4')).to.throw();
        });
    });

    describe('dice groups', () => {

        it('should fail if an empty dice group is passed', () => {
            expect(() => parse('{}')).to.throw();
        });

        it('should parse a dice group containing a single item into a diceGroup node', () => {
            expect(parse('{ 3 }')).to.eql(diceGroup({
                elements: [number(3)],
            }));
        });

        it('should parse a dice group containing multiple items', () => {
            expect(parse('{ 3, 4 }')).to.eql(diceGroup({
                elements: [number(3), number(4)],
            }));
        });

        it('should accept whitespace around any element', () => {
            expect(parse('   {    3,4,}')).to.eql(diceGroup({
                elements: [number(3), number(4)],
            }));
            expect(parse('{   3    ,4,}')).to.eql(diceGroup({
                elements: [number(3), number(4)],
            }));
            expect(parse('{3  ,   4,}')).to.eql(diceGroup({
                elements: [number(3), number(4)],
            }));
            expect(parse('{3,   4  ,}')).to.eql(diceGroup({
                elements: [number(3), number(4)],
            }));
            expect(parse('{3,4   , }')).to.eql(diceGroup({
                elements: [number(3), number(4)],
            }));
            expect(parse('{3,4, }   ')).to.eql(diceGroup({
                elements: [number(3), number(4)],
            }));
        });

        it('should accept a trailing comma', () => {
            expect(parse('{3, 4, 5,}')).to.eql(diceGroup({
                elements: [number(3), number(4), number(5)],
            }));
        });

        it('should accept any valid expression', () => {
            expect(parse('{3, 4d1, 5 + 6d1, (7 / 3) + 2}'))
                .to.eql(diceGroup({
                elements: [
                    parse('3'),
                    parse('4d1'),
                    parse('5 + 6d1'),
                    parse('(7 / 3) + 2'),
                ],
            }));
        });

        it('should accept sub-dice groups', () => {
            expect(parse('{ { 2d1, 4 }, 8, 9 }')).to.eql(diceGroup({
                elements: [
                    diceGroup({ elements: [parse('2d1'), number(4)] }),
                    number(8),
                    number(9),
                ],
            }));
        });

    });

    describe('dice group modifiers', () => {

        it('should add success modifiers to the dice group object', () => {
            expect(parse('{ 3d1 }>4')).to.eql(diceGroup({
                elements: [dice({ noDice: 3, diceSides: [1] })],
                success: { op: '>', number: 4 },
            }));
        });

        it('should add success and failure modifiers to the dice group object', () => {
            expect(parse('{ 3d1 }>4f<1')).to.eql(diceGroup({
                elements: [dice({ noDice: 3, diceSides: [1] })],
                success: { op: '>', number: 4 },
                failure: { op: '<', number: 1 },
            }));
        });

        it('should not parse a failure condition by itself', () => {
            expect(() => parse('{ 4d1 }f<4')).to.throw();
        });

        it('should add keep modifiers to the dice group object', () => {
            expect(parse('{3d1}k2')).to.eql(diceGroup({
                elements: [dice({ noDice: 3, diceSides: [1] })],
                keep: { direction: 'h', number: 2 },
            }));
            expect(parse('{3d1}kh2')).to.eql(diceGroup({
                elements: [dice({ noDice: 3, diceSides: [1] })],
                keep: { direction: 'h', number: 2 },
            }));
            expect(parse('{3d1}kl2')).to.eql(diceGroup({
                elements: [dice({ noDice: 3, diceSides: [1] })],
                keep: { direction: 'l', number: 2 },
            }));
        });

        it('should add drop modifiers to the dice group object', () => {
            expect(parse('{3d1}d2')).to.eql(diceGroup({
                elements: [dice({ noDice: 3, diceSides: [1] })],
                drop: { direction: 'l', number: 2 },
            }));
            expect(parse('{3d1}dh2')).to.eql(diceGroup({
                elements: [dice({ noDice: 3, diceSides: [1] })],
                drop: { direction: 'h', number: 2 },
            }));
            expect(parse('{3d1}dl2')).to.eql(diceGroup({
                elements: [dice({ noDice: 3, diceSides: [1] })],
                drop: { direction: 'l', number: 2 },
            }));
        });

        it('should not accept any additional modifiers', () => {
            expect(() => parse('{3d1}r3')).to.throw();
        });

    });

});
