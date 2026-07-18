import codeExample from './js/codeExample.js';
import babelParser from './js/babel.js';
import espreeParser from './js/espree.js';
import esprima from './js/esprima.js';
import acorn from './js/acorn.js';
import putoutTransformer from './js/transformers/putout/index.js';
import putoutDefaultTransform from './js/transformers/putout/codeExample.js';
import {
    id,
    displayName,
    mimeTypes,
    fileExtension,
} from './js/index.js';

const jsCategory = {
    id,
    displayName,
    mimeTypes,
    fileExtension,
    codeExample,
};

export const parsers = [
    babelParser,
    espreeParser,
    esprima,
    acorn,
];

for (const parser of parsers) {
    parser.category = jsCategory;
}

jsCategory.parsers = parsers;

putoutTransformer.defaultTransform = putoutDefaultTransform;

const transformers = [putoutTransformer];

jsCategory.transformers = transformers;

const categoryByID = {
    [jsCategory.id]: jsCategory,
};

const buildTuple = (a) => [a.id, a];
const isShowInMenu = ({showInMenu}) => showInMenu;

const parserByID = Object.fromEntries(parsers.map(buildTuple));
const transformerByID = Object.fromEntries(transformers.map(buildTuple));

export const categories = [jsCategory];
export const getCategoryByID = (id) => categoryByID[id];
export const getParserByID = (id) => parserByID[id];
export const getTransformerByID = (id) => transformerByID[id];
export function getDefaultParser(category = jsCategory) {
    const [first] = category.parsers.filter(isShowInMenu);
    return first;
}
