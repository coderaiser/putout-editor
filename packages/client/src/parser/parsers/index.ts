import codeExample from './js/codeExample.ts';
import babelParser from './js/babel.ts';
import espreeParser from './js/espree.tsx';
import esprima from './js/esprima.ts';
import acorn from './js/acorn.tsx';
import putoutTransformer from './js/transformers/putout/index.ts';
import putoutDefaultTransform from './js/transformers/putout/codeExample.ts';
import {
    id,
    displayName,
    mimeTypes,
    fileExtension,
} from './js/index.ts';

export interface ParserCategory {
    id: string;
    displayName: string;
    mimeTypes: string[];
    fileExtension: string;
    codeExample: string;
    parsers: ParserInfo[];
    transformers?: TransformerInfo[];
}

export interface ParserInfo {
    id: string;
    displayName?: string;
    version?: string;
    homepage?: string;
    defaultParserID?: string;
    defaultTransform?: string;
    category?: ParserCategory;
    showInMenu?: boolean;
    hasSettings?: () => boolean;
    [option: string]: unknown;
}

export interface TransformerInfo {
    id: string;
    displayName?: string;
    version?: string;
    homepage?: string;
    defaultParserID?: string;
    defaultTransform?: string;
    category?: ParserCategory;
    showInMenu?: boolean;
    [option: string]: unknown;
}

export const parsers: ParserInfo[] = [
    babelParser as ParserInfo,
    espreeParser as ParserInfo,
    esprima as ParserInfo,
    acorn as ParserInfo,
];

const jsCategory: ParserCategory = {
    id,
    displayName,
    mimeTypes,
    fileExtension,
    codeExample,
    parsers,
};

for (const parser of parsers) {
    parser.category = jsCategory;
}

jsCategory.parsers = parsers;

(putoutTransformer as TransformerInfo).defaultTransform = putoutDefaultTransform;

const transformers: TransformerInfo[] = [putoutTransformer as TransformerInfo];

jsCategory.transformers = transformers;

const categoryByID: Record<string, ParserCategory> = {
    [jsCategory.id]: jsCategory,
};

const buildTuple = (a: ParserInfo | TransformerInfo) => [a.id, a] as const;
const isShowInMenu = ({showInMenu}: ParserInfo) => showInMenu;

const parserByID: Record<string, ParserInfo> = Object.fromEntries(parsers.map(buildTuple));
const transformerByID: Record<string, TransformerInfo> = Object.fromEntries(transformers.map(buildTuple));

export const categories = [jsCategory];
export const getCategoryByID = (id: string): ParserCategory | undefined => categoryByID[id];
export const getParserByID = (id: string): ParserInfo | undefined => parserByID[id];
export const getTransformerByID = (id: string): TransformerInfo | undefined => transformerByID[id];
export function getDefaultParser(category: ParserCategory = jsCategory): ParserInfo {
    const [first] = category.parsers.filter(isShowInMenu);
    return first!;
}
