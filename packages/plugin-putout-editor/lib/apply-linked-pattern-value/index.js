import {types} from 'putout';

const DOUBLE = /__([a-zA-Z])__/;
const DOUBLE_ALL = /__([a-zA-Z])__/g;

export const report = (_, {message}) => message;
export const fix = ({node}) => {
    node.key = types.stringLiteral(node.key.value.replace(DOUBLE_ALL, '__$1'));
};

export const traverse = ({push}) => ({
    ObjectProperty(path) {
        const {key} = path.node;
        
        if (key.type === 'StringLiteral' && DOUBLE.test(key.value))
            push(path, {
                message: `☝️ ${key.value}: __a__ binds nothing, so the pattern matches 0 places`,
            });
    },
});
