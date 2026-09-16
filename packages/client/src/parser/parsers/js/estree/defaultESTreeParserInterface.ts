import defaultParserInterface from './defaultParserInterface.tsx';
import type {AstNode} from '../../../../types.ts';

export default {
    ...defaultParserInterface,
    opensByDefault(node: AstNode | null, key: string) {
        return node
            && node.type === 'Program'
            || key === 'body'
            || key === 'elements'
            || key === 'declarations'
            || key === 'expression';
    },
};
