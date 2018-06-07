import { lexer } from '../../src/lexer';

import expect from 'must';

describe('lexer', () => {

    it('should handle dice tokens', () => {
        lexer.reset('d14d0dF');
        expect(lexer.next()).to.have.properties({ type: 'dice' });
        expect(lexer.next()).to.have.properties({ type: 'numNot0', value: '14' });
        expect(lexer.next()).to.have.properties({ type: 'dice' });
        expect(lexer.next()).to.have.properties({ type: 'num0', value: '0' });
        expect(lexer.next()).to.have.properties({ type: 'dice' });
        expect(lexer.next()).to.have.properties({ type: 'numFate' });
    });

});
