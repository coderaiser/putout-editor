/**
 * A parser that has been through the category assignment loop in `parsers/index.ts`.
 * Every parser is guaranteed to have a `category`, so we can require it.
 */
import type {EditorTransformer} from '#editor-code';
import type {ParserWithLoader} from '../../store/operations.ts';

/**
 * A parser that has been through the category assignment loop in `parsers/index.ts`.
 * Every parser is guaranteed to have a `category`, so we can require it.
 */
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

// ... existing imports ...
export interface ParserCategory {
    id: string;
    displayName: string;
    mimeTypes: string[];
    fileExtension: string;
    codeExample: string;
    editorMode?: string;
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
export type ParserInfoWithCategory = ParserInfo & ParserWithLoader & {
    category: ParserCategory;
    // Registered parsers all implement property traversal as a generator.
    forEachProperty: (node: unknown) => Iterable<{
        value: unknown;
        key: string;
        computed: boolean;
    }>;
};

// ... existing imports ...
export interface TransformerInfo extends EditorTransformer {
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
const transformerByID: Record<string, TransformerInfo> = Object.fromEntries(transformers.map((t) => [t.id, t] as const));

export const categories = [jsCategory];
export const getCategoryByID = (id: string): ParserCategory | undefined => categoryByID[id];
export const getParserByID = (id: string): ParserInfo | undefined => parserByID[id];
export const getTransformerByID = (id: string): TransformerInfo | undefined => transformerByID[id];
export function getDefaultParser(category: ParserCategory = jsCategory): ParserInfo {
    const [first] = category.parsers.filter(isShowInMenu);
    return first!;
}
