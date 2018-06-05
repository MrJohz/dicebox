import { Parser, Grammar } from 'nearley';
import * as grammar from './parser/grammar';

const parser = new Parser(Grammar.fromCompiled(grammar));

console.log(parser.feed('3d6').results);

export const THREE = 3;

export const spread = { ...{ key: THREE } };
