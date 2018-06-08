import { parse } from '../../src/parser';

import expect from 'must';
import { dice, number } from '../../src/types';

describe('parse', () => {

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
