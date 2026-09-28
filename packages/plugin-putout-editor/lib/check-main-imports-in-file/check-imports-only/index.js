import {types} from 'putout';

const {isCallExpression} = types;

const WRAPPERS = [
    '__putout_processor_css',
    'raw',
];

const isImport = ({node}) => node.callee.name === 'cssImport';

export const report = () => 'main.css is an entry point: @import only';

export const filter = (path) => {
    const {node} = path;
    
    return !isImport(path) && !(isCallExpression(node) && WRAPPERS.includes(node.callee.name));
};

export const include = () => [
    'CallExpression',
];

export const fix = (path) => path;
