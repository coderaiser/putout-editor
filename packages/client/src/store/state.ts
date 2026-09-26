import {
    getCategoryByID,
    getDefaultParser,
    getTransformerByID,
} from '#parser';
import type {TreeAdapterParseResult} from '../parser/TreeAdapter.ts';
import type {ParserSettings} from '../types.ts';

/**
 * Result of parsing the current code with the active parser.
 * `null` is the initial state before anything has been parsed.
 *
 * On success: `{ast, treeAdapter, time, source, error: null}`.
 * On failure: `{ast: null, treeAdapter: null, time: null, source: null, error}`.
 *
 * `ast` stays `unknown` — the AST shape depends on the active parser
 * (Babel, Acorn, Esprima all differ). Consumers narrow it explicitly.
 *
 * `treeAdapter` is the raw parse-result config `{type, options}`, not a
 * `TreeAdapter` instance — the instance is built later by
 * `treeAdapterFromParseResult` (see `parser/TreeAdapter.ts`).
 */
export type ParseResult = {
    ast: unknown;
    treeAdapter: NonNullable<TreeAdapterParseResult['treeAdapter']> | null;
    time: number | null;
    source: string | null;
    error: Error | null;
} | null;

// ParserSettings is shared with the parser contract, so it lives in ../types.ts.
export type {ParserSettings} from '../types.ts';

/**
 * A `[start, end]` source range highlighted in the editor.
 */
export type Range = [
    number,
    number,
];

export interface Revision {
    canSave(): boolean;
    getSnippetID(): string;
    getRevisionID(): string;
    getTransformerID(): string | null;
    getTransformCode(): string;
    getParserID(): string;
    getCode(): string;
    getParserSettings(): ParserSettings;
    getPath(): string;
    getShareData(): {
        versionedURL: string;
        latestURL: string | null;
        embedURL: string | null;
    };
}

export interface TransformState {
    code: string;
    initialCode: string;
    transformer: string;
}

export interface WorkbenchState {
    parser: string;
    parserSettings: ParserSettings;
    parseError: Error | null;
    parseResult: ParseResult;
    code: string;
    keyMap: string;
    initialCode: string;
    transform: TransformState;
}

export interface State {
    showSettingsDialog: boolean;
    showShareDialog: boolean;
    loadingSnippet: boolean;
    forking: boolean;
    saving: boolean;
    cursor: number | null;
    error: Error | null;
    highlightRange: Range | null;
    showTransformPanel: boolean;
    selectedRevision: null;
    activeRevision: Revision | null;
    parserSettings: Record<string, ParserSettings>;
    parserPerCategory: Record<string, string>;
    workbench: WorkbenchState;
}

/**
 * Source for a `reset` action: a template and the fixture to parse it with.
 * Both are optional, and a bare string is treated as the template.
 */
export type ResetPayload = {
    template?: string;
    fixture?: string;
};

export const defaultParser = getDefaultParser(getCategoryByID('javascript')!)!;
export const defaultTransformer = getTransformerByID('putout')!;

export const initialState: State = {
    // UI related state
    showSettingsDialog: false,
    showShareDialog: false,
    loadingSnippet: false,
    forking: false,
    saving: false,
    cursor: null,
    error: null,
    highlightRange: null,
    showTransformPanel: true, // Snippet related state
    selectedRevision: null, // Workbench settings
    activeRevision: null,
    // Contains local settings of all parsers
    parserSettings: {}, // Remember selected parser per category
    parserPerCategory: {},
    
    workbench: {
        parser: defaultParser.id,
        parserSettings: null,
        parseError: null,
        parseResult: null,
        code: defaultParser.category!.codeExample,
        keyMap: 'vim',
        initialCode: defaultParser.category!.codeExample,
        transform: {
            code: defaultTransformer.defaultTransform!,
            initialCode: defaultParser.category!.codeExample,
            transformer: defaultTransformer.id,
        },
    },
};
