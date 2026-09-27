import {types} from 'putout';
import defaultParserInterface from './defaultParserInterface.tsx';
import type {AstNode} from '../../../../types.ts';

const {isProgram} = types;

export default {
    ...defaultParserInterface,
    opensByDefault(node: AstNode | null, key: string) {
        return node
            && isProgram(node)
            || key === 'body'
            || key === 'elements'
            || key === 'declarations'
            || key === 'expression';
    },
};
