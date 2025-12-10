import {createSelector} from 'reselect';
import isEqual from 'lodash.isequal';
import {
    getParserByID,
    getTransformerByID,
} from '../parsers';

// UI related
export const getFormattingState = (state) => state.enableFormatting;

export const getCursor = (state) => state.cursor;

export const getError = (state) => state.error;

export const isLoadingSnippet = (state) => state.loadingSnippet;

export const showSettingsDialog = (state) => state.showSettingsDialog;

export const showShareDialog = (state) => state.showShareDialog;

export const isForking = (state) => state.forking;

export const isSaving = (state) => state.saving;

// Parser related
export function getParser(state) {
    return getParserByID(state.workbench.parser);
}

export function getParserSettings(state) {
    return state.workbench.parserSettings;
}

export const getParseResult = (state) => state.workbench.parseResult;

// Code related
export function getRevision(state) {
    return state.activeRevision;
}

export function getCode(state) {
    return state.workbench.code;
}

export function getInitialCode(state) {
    return state.workbench.initialCode;
}

export const getKeyMap = (state) => state.workbench.keyMap;

const isCodeDirty = createSelector([getCode, getInitialCode], (code, initialCode) => code !== initialCode);

// Transform related
export function getTransformCode(state) {
    return state.workbench.transform.code;
}

export function getInitialTransformCode(state) {
    return state.workbench.transform.initialCode;
}

export function getTransformer(state) {
    return getTransformerByID(state.workbench.transform.transformer);
}

export function showTransformer(state) {
    return state.showTransformPanel;
}

const isTransformDirty = createSelector([getTransformCode, getInitialTransformCode], (code, initialCode) => code !== initialCode);

export const canFork = createSelector([getRevision], Boolean);

const canSaveCode = createSelector([getRevision, isCodeDirty], (revision, dirty) => !revision // can always save if there is no revision
 || dirty);

export const canSaveTransform = createSelector([showTransformer, isTransformDirty], (showTransformer, dirty) => showTransformer && dirty);

const didParserSettingsChange = createSelector([getParserSettings, getRevision, getParser], (parserSettings, revision, parser) => {
    const savedParserSettings = revision?.getParserSettings();
    return revision
        && (parser.id !== revision.getParserID()
        || savedParserSettings
        && !isEqual(parserSettings, savedParserSettings));
});

export const canSave = createSelector([
    getRevision,
    canSaveCode,
    canSaveTransform,
    didParserSettingsChange,
], (revision, canSaveCode, canSaveTransform, didParserSettingsChange) => (canSaveCode || canSaveTransform || didParserSettingsChange) && (!revision || revision.canSave()));
