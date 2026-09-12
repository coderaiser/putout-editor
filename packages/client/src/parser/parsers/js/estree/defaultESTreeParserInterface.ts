import defaultParserInterface from './defaultParserInterface.js';

export default {
    ...defaultParserInterface,
    opensByDefault(node: any, key: string) {
        return node
            && node.type === 'Program'
            || key === 'body'
            || key === 'elements'
            || key === 'declarations'
            || key === 'expression';
    },
};
