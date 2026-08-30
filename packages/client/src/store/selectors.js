import {createSelector} from '@reduxjs/toolkit';

// UI related
export const getCursor = (state) => state.cursor;

export const getHighlightRange = (state) => state.highlightRange;

export const getError = (state) => state.error;

export const isLoadingSnippet = (state) => state.loadingSnippet;

export const showSettingsDialog = (state) => state.showSettingsDialog;

export const showShareDialog = (state) => state.showShareDialog;

export const isForking = (state) => state.forking;

export const isSaving = (state) => state.saving;

export const getParserSettings = (state) => state.workbench.parserSettings;

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

export function showTransformer(state) {
    return state.showTransformPanel;
}

const isTransformDirty = createSelector([
    getTransformCode,
    getInitialTransformCode,
], (code, initialCode) => code !== initialCode);

export const canFork = createSelector([getRevision], Boolean);

export const canSaveCode = createSelector([getRevision, isCodeDirty], (revision, dirty) => !revision // can always save if there is no revision
 || dirty);

export const canSaveTransform = createSelector([showTransformer, isTransformDirty], (showTransformer, dirty) => showTransformer && dirty);
