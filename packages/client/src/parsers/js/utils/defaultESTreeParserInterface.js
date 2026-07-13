import defaultParserInterface from '../../utils/defaultParserInterface.js';

export default {
    ...defaultParserInterface,
    opensByDefault(node, key) {
        return node
            && node.type === 'Program'
            || key === 'body'
            || key === 'elements'
            || key === 'declarations'
            || key === 'expression';
    },
};
