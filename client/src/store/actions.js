export const SET_ERROR = 'SET_ERROR';
export const CLEAR_ERROR = 'CLEAR_ERROR';
export const LOAD_SNIPPET = 'LOAD_SNIPPET';
export const START_LOADING_SNIPPET = 'START_LOADING_SNIPPET';
export const DONE_LOADING_SNIPPET = 'DONE_LOADING_SNIPPET';
export const CLEAR_SNIPPET = 'CLEAR_SNIPPET';
export const SELECT_CATEGORY = 'CHANGE_CATEGORY';
export const SELECT_TRANSFORMER = 'SELECT_TRANSFORMER';
export const HIDE_TRANSFORMER = 'HIDE_TRANSFORMER';
export const SET_TRANSFORM = 'SET_TRANSFORM';
export const SET_PARSER = 'SET_PARSER';
export const SET_PARSER_SETTINGS = 'SET_PARSER_SETTINGS';
export const SET_PARSE_RESULT = 'SET_PARSE_RESULT';
export const SET_SNIPPET = 'SET_SNIPPET';
export const OPEN_SETTINGS_DIALOG = 'OPEN_SETTINGS_DIALOG';
export const CLOSE_SETTINGS_DIALOG = 'CLOSE_SETTINGS_DIALOG';
export const OPEN_SHARE_DIALOG = 'OPEN_SHARE_DIALOG';
export const CLOSE_SHARE_DIALOG = 'CLOSE_SHARE_DIALOG';
export const SET_CODE = 'SET_CODE';
export const SET_CURSOR = 'SET_CURSOR';
export const DROP_TEXT = 'DROP_TEXT';
export const SAVE = 'SAVE';
export const START_SAVE = 'START_SAVE';
export const END_SAVE = 'END_SAVE';
export const RESET = 'RESET';
export const TOGGLE_FORMATTING = 'TOGGLE_FORMATTING';
export const SET_KEY_MAP = 'SET_KEY_MAP';

export const setParser = (parser) => ({
    type: SET_PARSER,
    parser,
});

export const setParserSettings = (settings) => ({
    type: SET_PARSER_SETTINGS,
    settings,
});

export const save = (fork = false) => ({
    type: SAVE,
    fork,
});

export const startSave = (fork) => ({
    type: START_SAVE,
    fork,
});

export const endSave = (fork) => ({
    type: END_SAVE,
    fork,
});

export const setSnippet = (revision) => ({
    type: SET_SNIPPET,
    revision,
});

export const selectCategory = (category) => ({
    type: SELECT_CATEGORY,
    category,
});

export const clearSnippet = () => ({
    type: CLEAR_SNIPPET,
});

export const startLoadingSnippet = () => ({
    type: START_LOADING_SNIPPET,
});

export const doneLoadingSnippet = () => ({
    type: DONE_LOADING_SNIPPET,
});

export const loadSnippet = () => ({
    type: LOAD_SNIPPET,
});

export const openSettingsDialog = () => ({
    type: OPEN_SETTINGS_DIALOG,
});

export const closeSettingsDialog = () => ({
    type: CLOSE_SETTINGS_DIALOG,
});

export const openShareDialog = () => ({
    type: OPEN_SHARE_DIALOG,
});

export const closeShareDialog = () => ({
    type: CLOSE_SHARE_DIALOG,
});

export const setError = (error) => ({
    type: SET_ERROR,
    error,
});

export const clearError = () => ({
    type: CLEAR_ERROR,
});

export const selectTransformer = (transformer) => ({
    type: SELECT_TRANSFORMER,
    transformer,
});

export const hideTransformer = () => ({
    type: HIDE_TRANSFORMER,
});

export const setTransformState = (state) => ({
    type: SET_TRANSFORM,
    ...state,
});

export const setCode = (state) => ({
    type: SET_CODE,
    ...state,
});

export const setCursor = (cursor) => ({
    type: SET_CURSOR,
    cursor,
});

export const dropText = (text, categoryId) => ({
    type: DROP_TEXT,
    text,
    categoryId,
});

export const reset = () => ({
    type: RESET,
});

export const toggleFormatting = () => ({
    type: TOGGLE_FORMATTING,
});

export const setKeyMap = (keyMap) => ({
    type: SET_KEY_MAP,
    keyMap,
});
