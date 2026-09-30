import {types} from 'putout';

const {
    isBlockStatement,
    isIdentifier,
    isJSXElement,
    isJSXFragment,
} = types;

const METHODS = [
    'every',
    'filter',
    'find',
    'findIndex',
    'findLast',
    'flatMap',
    'forEach',
    'map',
    'reduce',
    'reduceRight',
    'some',
    'sort',
];

// `remove-comments` strips this, and the README section exists because of it: a guard that is
// about *naming* has no business in a rule that does not name, and skipping a destructured
// parameter is the fixer's problem, not the reporter's. `places.map(({position}) => position)`
// hoists perfectly well — it just cannot invent the name.
const isHoistable = ({__a}, path) => {
    if (!isIdentifier(__a))
        return false;
    
    const [argument] = path.node.arguments;
    const {body} = argument;
    
    if (isBlockStatement(body))
        return false;
    
    return !isJSXElement(body) && !isJSXFragment(body);
};

const withMethod = (method) => `__.${method}((__a) => __b)`;

const toPairs = (to) => (method) => [
    withMethod(method),
    to(method),
];

const buildKeys = (to) => Object.fromEntries(METHODS.map(toPairs(to)));

export const report = () => 'Move the arrow callback to a top level declaration';

export const match = () => buildKeys(() => isHoistable);

export const replace = () => buildKeys(withMethod);
