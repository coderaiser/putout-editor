import {print} from 'putout';

const WIDTH = new Set(['width']);

const PADDING = new Set([
    'padding-left',
    'padding-right',
    'padding-inline',
    'padding-inline-start',
    'padding-inline-end',
]);

const ZERO = /^(|0[a-z%]*)$/;

const source = (node) => String(node.type === 'CallExpression' ? print(node) : node.value || node.name || '').trim();

const inlineOf = (value) => value.arguments[0].elements.map(source);

const nonZero = (part) => !ZERO.test(part);

const list = (value) => value.type === 'CallExpression' && value.callee.name === 'valueList'
    ? inlineOf(value)
    : [
        source(value),
    ];

const inlineParts = (value) => {
    const parts = list(value);
    
    if (parts.length === 1)
        return parts.filter(nonZero);
    
    const [
        ,
        second,
        ,
        fourth,
    ] = parts;
    
    return [second, fourth]
        .filter(Boolean)
        .filter(nonZero);
};

const longhand = (property) => PADDING.has(property);

const isCalc = (value) => value.type === 'CallExpression' && value.callee.name === 'functionValue' && value.arguments[0].value === 'calc';

const subtracts = (value) => isCalc(value) && print(value).includes('operator');

const padsInline = (property, value) => {
    if (longhand(property))
        return !ZERO.test(source(value));
    
    if (property !== 'padding')
        return false;
    
    return inlineParts(value).length > 0;
};

const declarationsOf = (body) => body.elements;

export const isWidth = (property) => WIDTH.has(property);

export const shaped = (declarations) => {
    let width = false;
    let padding = false;
    let sized = false;
    
    for (const {arguments: args} of declarations) {
        const property = args && args[0] && args[0].value;
        
        if (property === 'box-sizing')
            sized = true;
        
        if (isWidth(property))
            width = !subtracts(args[1]);
        
        if (padsInline(property, args && args[1]))
            padding = true;
    }
    
    return !sized && width && padding;
};

export const report = () => 'content-box with a width and horizontal padding overflows its parent, add box-sizing: border-box';

export const match = () => ({
    'rule(__a, __b)': ({__b}) => shaped(declarationsOf(__b)),
});

const property = (declaration, name) => ({
    ...declaration,
    value: name,
    raw: `'${name}'`,
    extra: {
        ...declaration.extra,
        rawValue: name,
        raw: `'${name}'`,
    },
});

const sized = (declaration) => ({
    ...declaration,
    arguments: [
        property(declaration.arguments[0], 'box-sizing'), {
            type: 'StringLiteral',
            value: 'border-box',
            raw: `'border-box'`,
            extra: {
                rawValue: 'border-box',
                raw: `'border-box'`,
            },
        },
    ],
});

export const replace = () => ({
    'rule(__a, __b)': ({__b}, path) => {
        const [first] = declarationsOf(__b);
        
        __b.elements.unshift(sized(first));
        
        return path;
    },
});
