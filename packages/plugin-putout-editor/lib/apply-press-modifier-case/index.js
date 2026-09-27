import {operator, types} from 'putout';

const {setLiteralValue} = operator;
const {
    isMemberExpression,
    isIdentifier,
    isStringLiteral,
} = types;

const MODIFIERS = 'Control|Shift|Alt|Meta|Mod|Cmd|ControlOrMeta';

const PRESS_WITH_MODIFIER = RegExp(`^(?:(?:${MODIFIERS})(?:\\+(?:${MODIFIERS}))*)\\+([A-Z])$`);

const isPress = (node) => isMemberExpression(node) && isIdentifier(node.property) && node.property.name === 'press';

const isKey = (node) => isStringLiteral(node) && PRESS_WITH_MODIFIER.test(node.value);

const lowerKey = (key) => {
    const boundary = key.lastIndexOf('+');
    
    return `${key.slice(0, boundary + 1)}${key
        .slice(boundary + 1)
        .toLowerCase()}`;
};

const matcher = ({}, path) => {
    const [arg] = path.node.arguments;
    
    return isPress(path.node.callee) && isKey(arg);
};

const replacer = ({}, path) => {
    const [arg] = path.node.arguments;
    
    setLiteralValue(arg, lowerKey(arg.value));
    
    return path;
};

const CALL = '__a(__args)';

export const report = () => 'Lowercase the key after a modifier: a browser reports Ctrl+V as "v"';

export const match = () => ({
    [CALL]: matcher,
});

export const replace = () => ({
    [CALL]: replacer,
});
