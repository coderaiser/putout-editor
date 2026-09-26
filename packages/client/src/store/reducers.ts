import {
    createSlice,
    type configureStore,
    type PayloadAction,
} from '@reduxjs/toolkit';
import {
    getCategoryByID,
    getDefaultParser,
    getParserByID,
    type ParserCategory,
} from '#parser';
import {
    defaultParser,
    defaultTransformer,
    initialState,
    type Range,
    type ResetPayload,
} from './state.ts';

// The two concerns that used to sit in this file. `initialState` and the state
// types live in ./state.ts, the storage migration in ./revive.ts, and both are
// re-exported below so the 34 files importing this path are unaffected.
export {
    persist,
    revive,
} from './revive.ts';
export type {
    ParseResult,
    ParserSettings,
    Range,
    ResetPayload,
    Revision,
    State,
    TransformState,
    WorkbenchState,
} from './state.ts';

const isString = (a: unknown): a is string => typeof a === 'string';

const normalizeResetPayload = (payload?: string | ResetPayload): ResetPayload => {
    if (isString(payload))
        return {
            template: payload,
        };
    
    return payload || {};
};

const noop = () => {};

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
