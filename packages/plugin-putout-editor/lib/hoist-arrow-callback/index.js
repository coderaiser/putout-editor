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

// A callback is hoistable when its body is an expression **and** its parameter is
// a plain identifier. The identifier is the point, not a limitation: the name the
// hoisted binding would take comes from the parameter, so a destructured one has
// no name to take. That is a question about the fixer — this rule reports the
// shape it can act on, and `places.map(({position}) => position)` is a normal
// expression, not a hoist the rule can describe.
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
