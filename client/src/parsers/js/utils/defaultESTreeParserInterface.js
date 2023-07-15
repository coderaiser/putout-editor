import defaultParserInterface from '../../utils/defaultParserInterface';

export default {
    ...defaultParserInterface,
    opensByDefault(node, key) {
        return node && node.type === 'Program' || key === 'body' || key === 'elements' // array literals
 || key === 'declarations' || key === 'expression';
    },
};
