import {createSelector} from '@reduxjs/toolkit';
import type {RootState} from './reducers.ts';

// UI related
export const getCursor = (state: RootState) => state.cursor;

export const getHighlightRange = (state: RootState) => state.highlightRange;

export const getError = (state: RootState) => state.error;

export const isLoadingSnippet = (state: RootState) => state.loadingSnippet;

export const showSettingsDialog = (state: RootState) => state.showSettingsDialog;

export const showShareDialog = (state: RootState) => state.showShareDialog;

export const isForking = (state: RootState) => state.forking;

export const isSaving = (state: RootState) => state.saving;

export const getParserSettings = (state: RootState) => state.workbench.parserSettings;

export const getParseResult = (state: RootState) => state.workbench.parseResult;

// Code related
export function getRevision(state: RootState) {
    return state.activeRevision;
}

export function getCode(state: RootState) {
    return state.workbench.code;
}

export function getInitialCode(state: RootState) {
    return state.workbench.initialCode;
}

export const getKeyMap = (state: RootState) => state.workbench.keyMap;

const isCodeDirty = createSelector([getCode, getInitialCode], (code, initialCode) => code !== initialCode);

// Transform related
export function getTransformCode(state: RootState) {
    return state.workbench.transform.code;
}

export function getInitialTransformCode(state: RootState) {
    return state.workbench.transform.initialCode;
}

export function showTransformer(state: RootState) {
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
