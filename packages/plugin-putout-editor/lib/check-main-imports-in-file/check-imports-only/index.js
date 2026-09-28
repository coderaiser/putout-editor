import {types} from 'putout';

const {isCallExpression} = types;

const WRAPPERS = [
    '__putout_processor_css',
    'raw',
];

const isImport = ({node}) => node.callee.name === 'cssImport';

const isWrapper = ({node}) => {
    return isCallExpression(node) && WRAPPERS.includes(node.callee.name);
};

export const report = () => 'main.css is an entry point: @import only';

export const filter = (path) => !isImport(path) && !isWrapper(path);

export const include = () => [
    'CallExpression',
];

export const fix = (path) => path;
