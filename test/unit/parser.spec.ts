import { parse } from '../../src/parser';

import expect from 'must';

describe('parse', () => {

    it(`should return a single n-sided dice when passed 'dN'`, () => {
        expect(parse('d6')).to.eql({ noDice: 1, diceSides: [1, 2, 3, 4, 5, 6] });
    });

    it(`should return N M-sided dice when passed 'NdM'`, () => {
        expect(parse('3d4')).to.eql({ noDice: 3, diceSides: [1, 2, 3, 4] });
    });

    it(`should return 0 N-sided dice when passed '0dN'`, () => {
        expect(parse('0d5')).to.eql({ noDice: 0, diceSides: [1, 2, 3, 4, 5] });
    });

    it(`should return N fate dice when passed 'NdF'`, () => {
        expect(parse('3dF')).to.eql({ noDice: 3, diceSides: [-1, 0, 1] });
    });

    it(`should throw an error if a 0-sided dice is constructed`, () => {
        expect(() => parse('3d0')).to.throw(/a dice may not have 0 sides/);
    });

    it(`should throw an error if an eof occurs after the first token`, () => {
        expect(() => parse('3')).to.throw(/Unexpected end of input: expected 'd'/)
    })

});
