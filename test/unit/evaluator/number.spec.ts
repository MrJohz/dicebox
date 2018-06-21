import expect from 'must';

import { Kind } from '../../../src/checker';
import { Evaluator } from '../../../src/evaluator';
import { number } from '../../../src/types';
import { loc } from '../../ignore-loc.util';

describe('evaluator/number', () => {

    describe('evaluateNumber', () => {
        it('should return a result containing that number', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(number(3)).value).to.eql(3);
        });

        it('should return a result with a number kind', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(number(3)).kind).to.eql(Kind.number);
        });

        it('should return an evaluation tree', () => {
            const evl = new Evaluator();
            expect(evl.evaluate(number(3)).tree).to.eql({
                nodeKind: 'number',
                loc: loc(0, 0),
                value: 3,
            });
        });
    });

});
