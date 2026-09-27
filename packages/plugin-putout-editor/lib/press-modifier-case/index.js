import {operator, types} from 'putout';

const {setLiteralValue} = operator;
const {
    isMemberExpression,
    isIdentifier,
    isStringLiteral,
} = types;

const MODIFIERS = 'Control|Shift|Alt|Meta|Mod|Cmd|ControlOrMeta';

// A browser reports Ctrl+V as `v`. Playwright's `press('Control+V')` sends `V` with no
// Shift keydown - a chord no keyboard produces - so it matches no codemirror-vim binding
// and the failure is silent: nothing throws, the browser just fires a paste instead.
const PRESS_WITH_MODIFIER = RegExp(`^(?:(?:${MODIFIERS})(?:\\+(?:${MODIFIERS}))*)\\+([A-Z])$`);

const isPress = (node) => isMemberExpression(node) && isIdentifier(node.property) && node.property.name === 'press';

// only the last segment is the key - `Control` and `Shift` keep their capital
const lowerKey = (key) => {
    const boundary = key.lastIndexOf('+');
    
    return `${key.slice(0, boundary + 1)}${key
        .slice(boundary + 1)
        .toLowerCase()}`;
};

export const report = () => 'Lowercase the key after a modifier: a browser reports Ctrl+V as "v"';

export const match = () => ({
    '__a(__args)': ({}, path) => {
        const call = path.node;
        
        if (!isPress(call.callee))
            return false;
        
        const [arg] = call.arguments;
        
        // putout's ast is a babel ast, so a string is a StringLiteral, not a Literal
        return isStringLiteral(arg) && PRESS_WITH_MODIFIER.test(arg.value);
    },
});

export const replace = () => ({
    '__a(__args)': ({}, path) => {
        const [arg] = path.node.arguments;
        
        setLiteralValue(arg, lowerKey(arg.value));
        
        return path;
    },
});
