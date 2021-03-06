import expect from 'must';

import { parse } from '../../../src/parser';
import { number } from '../../../src/types';
import { acceptLoc, ignoreLoc } from '../../ignore-loc.util';

describe('parser/numbers', () => {

    beforeEach(() => { ignoreLoc(expect); });
    afterEach(() => { acceptLoc(expect); });

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

        it('should handle negative integers', () => {
            expect(parse('-4')).to.eql(number({ value: -4 }));
        });

        it('should handle negative fractions', () => {
            expect(parse('-3.5')).to.eql(number({ value: -3.5 }));
        });

    });

});
