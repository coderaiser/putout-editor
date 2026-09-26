import {
    createSlice,
    type configureStore,
    type PayloadAction,
} from '@reduxjs/toolkit';
import {
    getCategoryByID,
    getDefaultParser,
    getParserByID,
    getTransformerByID,
    type ParserCategory,
} from '#parser';

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
import type {TreeAdapterParseResult} from '../parser/TreeAdapter.ts';

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
const isString = (a: unknown): a is string => typeof a === 'string';

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
export type ResetPayload = {
    template?: string;
    fixture?: string;
};

const normalizeResetPayload = (payload?: string | ResetPayload): ResetPayload => {
    if (isString(payload))
        return {
            template: payload,
        };
    
    return payload || {};
};

export type ParseResult = {
    ast: unknown;
    treeAdapter: NonNullable<TreeAdapterParseResult['treeAdapter']> | null;
    time: number | null;
    source: string | null;
    error: Error | null;
} | null;

/**
 * Parser-specific config object (babel options, acorn options, ...).
 * There is no shared schema across parsers — `null` is the "no settings" state.
 */
export type ParserSettings = Record<string, unknown> | null;

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

const noop = () => {};

const defaultParser = getDefaultParser(getCategoryByID('javascript')!)!;
const defaultTransformer = getTransformerByID('putout')!;

const initialState: State = {
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

/**
 * Returns the subset of the data that makes sense to persist between visits.
 */
export const persist = (state: State) => ({
    ...pick(state, 'showTransformPanel', 'parserSettings', 'parserPerCategory'),
    workbench: {
        ...pick(state.workbench, 'parser', 'code', 'keyMap'),
        transform: pick(state.workbench.transform, 'code', 'transformer'),
    },
});

/**
 * When read from persistent storage, set the last stored code as initial version.
 * This is necessary because we use CodeMirror as an uncontrolled component.
 *
 * Note this *derives* `workbench.initialCode`, `workbench.parserSettings` and
 * `workbench.transform.initialCode` from other state. Anything that passes a
 * preloaded state through here will have those three overwritten, so set the
 * fields they come from — `workbench.code`, the top-level
 * `parserSettings[parser]` map, and `workbench.transform.code` — instead.
 */
export const revive = (state: State = initialState) => ({
    ...state,
    workbench: {
        ...state.workbench,
        initialCode: state.workbench.code,
        parserSettings: state.parserSettings[state.workbench.parser] || null,
        transform: {
            ...state.workbench.transform,
            initialCode: state.workbench.transform.code,
        },
    },
});

const slice = createSlice({
    name: 'putoutEditor',
    initialState,
    reducers: {
        openSettingsDialog: (state) => {
            state.showSettingsDialog = true;
        },
        closeSettingsDialog: (state) => {
            state.showSettingsDialog = false;
        },
        openShareDialog: (state) => {
            state.showShareDialog = true;
        },
        closeShareDialog: (state) => {
            state.showShareDialog = false;
        },
        setError: (state, {payload}) => {
            state.error = payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        setHighlight: (state, {payload: range}: PayloadAction<Range | null | undefined>) => {
            if (!range) {
                state.highlightRange = null;
                return;
            }
            
            if (state.highlightRange && state.highlightRange[0] === range[0] && state.highlightRange[1] === range[1])
                return;
            
            state.highlightRange = range;
        },
        clearHighlight: (state, {payload: range}: PayloadAction<Range | null | undefined>) => {
            if (!range || state.highlightRange && range[0] === state.highlightRange[0] && range[1] === state.highlightRange[1])
                state.highlightRange = null;
        },
        setKeyMap: (state, {payload}) => {
            state.workbench.keyMap = payload;
        },
        setCursor: (state, {payload}) => {
            if (state.cursor === payload)
                return;
            
            state.cursor = payload;
        },
        startLoadingSnippet: (state) => {
            state.loadingSnippet = true;
        },
        doneLoadingSnippet: (state) => {
            state.loadingSnippet = false;
        },
        startSave: (state, {payload: fork}) => {
            state.saving = !fork;
            state.forking = Boolean(fork);
        },
        endSave: (state) => {
            state.saving = false;
            state.forking = false;
        },
        hideTransformer: (state) => {
            state.showTransformPanel = false;
        },
        
        editorBlur: noop,
        transformBlur: noop,
        setCode: (state, {payload: {code, cursor}}) => {
            state.workbench.code = code;
            
            if (cursor != null && cursor)
                state.cursor = cursor;
        },
        
        setParseResult: (state, {payload: result}) => {
            state.workbench.parseResult = result;
        },
        
        setParserSettings: (state, {payload: settings}) => {
            state.workbench.parserSettings = settings;
            
            if (!state.activeRevision)
                state.parserSettings[state.workbench.parser] = settings;
        },
        
        setParser: (state, {payload: parser}) => {
            state.workbench.parser = parser.id;
            state.parserPerCategory[parser.category.id] = parser.id;
            
            state.workbench.parserSettings = state.parserSettings[parser.id] || null;
        },
        
        setTransformState: (state, {payload: {code}}) => {
            state.workbench.transform.code = code;
        },
        
        selectTransformer: (state, {payload: transformer}) => {
            state.showTransformPanel = true;
            
            const differentParser = transformer.defaultParserID !== state.workbench.parser;
            const differentTransformer = transformer.id !== state.workbench.transform.transformer;
            
            if (!differentParser && !differentTransformer)
                return;
            
            if (differentParser) {
                state.workbench.parser = transformer.defaultParserID;
                state.workbench.parserSettings = state.parserSettings[transformer.defaultParserID] || null;
            }
            
            if (differentTransformer) {
                const snippetHasDifferentTransform = state.activeRevision && state.activeRevision.getTransformerID() === transformer.id;
                
                state.workbench.transform = {
                    ...state.workbench.transform,
                    transformer: transformer.id,
                    code: snippetHasDifferentTransform ? state.workbench.transform.code : transformer.defaultTransform,
                    initialCode: snippetHasDifferentTransform ? state.activeRevision?.getTransformCode() : transformer.defaultTransform,
                };
            }
        },
        
        setSnippet: (state, {payload: revision}) => {
            state.activeRevision = revision;
            state.cursor = null;
            state.showTransformPanel = Boolean(revision.getTransformerID());
            state.workbench.parser = revision.getParserID();
            state.workbench.parserSettings = revision.getParserSettings() || state.parserSettings[revision.getParserID()] || null;
            state.workbench.code = revision.getCode();
            state.workbench.initialCode = revision.getCode();
            state.workbench.transform = {
                ...state.workbench.transform,
                transformer: revision.getTransformerID(),
                code: revision.getTransformCode(),
                initialCode: revision.getTransformCode(),
            };
        },
        
        clearSnippet: (state) => {
            resetWorkbenchFromParser(state);
        },
        
        reset: {
            reducer: (state, {payload}: PayloadAction<ResetPayload | undefined>) => {
                const {template, fixture} = normalizeResetPayload(payload);
                resetWorkbenchFromParser(state, template, fixture);
            },
            prepare: (payload?: string | ResetPayload) => ({
                payload: normalizeResetPayload(payload),
            }),
        },
        
        selectCategory: (state, {payload: category}) => {
            selectParserFromCategory(state, category);
        },
        
        dropText: (state, {payload: {text, categoryId}}) => {
            const category = getCategoryByID(categoryId)!;
            
            selectParserFromCategory(state, category);
            state.workbench.code = text;
            state.workbench.initialCode = text;
        },
    },
});

function resetWorkbenchFromParser(state: RootState, template?: string, fixture?: string) {
    const parser = getParserByID(state.workbench.parser)!;
    const hadTransformer = state.activeRevision?.getTransformerID();
    const code = fixture || parser.category!.codeExample;
    
    state.activeRevision = null;
    state.cursor = null;
    state.showTransformPanel = true;
    state.workbench.parserSettings = state.parserSettings[state.workbench.parser] || null;
    state.workbench.code = code;
    state.workbench.initialCode = code;
    
    if (hadTransformer || state.workbench.transform.transformer || template)
        state.workbench.transform = {
            code: template || defaultTransformer.defaultTransform!,
            initialCode: defaultParser.category!.codeExample,
            transformer: defaultTransformer.id,
        };
}

type Category = {
    id: string;
    displayName: string;
    mimeTypes: string[];
    fileExtension: string;
    codeExample: string;
};

function selectParserFromCategory(state: RootState, category: Category) {
    const parserId = state.parserPerCategory[category.id] || getDefaultParser(category as ParserCategory)!.id;
    
    state.workbench.parser = parserId;
    state.workbench.parserSettings = state.parserSettings[parserId] || null;
    state.workbench.code = category.codeExample;
    state.workbench.initialCode = category.codeExample;
    state.showTransformPanel = true;
    state.activeRevision = null;
}

export const {
    openSettingsDialog,
    closeSettingsDialog,
    openShareDialog,
    closeShareDialog,
    setError,
    clearError,
    setHighlight,
    clearHighlight,
    setKeyMap,
    setCursor,
    editorBlur,
    transformBlur,
    setCode,
    setParseResult,
    setParserSettings,
    setParser,
    setTransformState,
    selectTransformer,
    hideTransformer,
    setSnippet,
    clearSnippet,
    reset,
    selectCategory,
    dropText,
    startLoadingSnippet,
    doneLoadingSnippet,
    startSave,
    endSave,
} = slice.actions;

export const putoutEditor = slice.reducer;

export type RootState = ReturnType<typeof putoutEditor>;

export type AppDispatch = ReturnType<typeof configureStore>['dispatch'];

function pick<T extends object, K extends keyof T>(obj: T, ...properties: K[]): Pick<T, K> {
    return properties.reduce((result, prop) => {
        result[prop] = obj[prop];
        return result;
    }, {} as Pick<T, K>);
}
