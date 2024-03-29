import {createSelector} from 'reselect';
import isEqual from 'lodash.isequal';
import {
    getParserByID,
    getTransformerByID,
} from '../parsers';

// UI related
export function getFormattingState(state) {
    return state.enableFormatting;
}

export function getCursor(state) {
    return state.cursor;
}

export function getError(state) {
    return state.error;
}

export function isLoadingSnippet(state) {
    return state.loadingSnippet;
}

export function showSettingsDialog(state) {
    return state.showSettingsDialog;
}

export function showShareDialog(state) {
    return state.showShareDialog;
}

export function isForking(state) {
    return state.forking;
}

export function isSaving(state) {
    return state.saving;
}

// Parser related
export function getParser(state) {
    return getParserByID(state.workbench.parser);
}

export function getParserSettings(state) {
    return state.workbench.parserSettings;
}

export function getParseResult(state) {
    return state.workbench.parseResult;
}

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

export function getKeyMap(state) {
    return state.workbench.keyMap;
}

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
    return revision && (parser.id !== revision.getParserID() || savedParserSettings && !isEqual(parserSettings, savedParserSettings));
});

export const canSave = createSelector([
    getRevision,
    canSaveCode,
    canSaveTransform,
    didParserSettingsChange,
], (revision, canSaveCode, canSaveTransform, didParserSettingsChange) => (canSaveCode || canSaveTransform || didParserSettingsChange) && (!revision || revision.canSave()));
