import {createSelector} from '@reduxjs/toolkit';
import isEqual from 'lodash.isequal';
import {
    getParserByID,
    getTransformerByID,
} from '../parsers/index.js';
import type {RootState} from '../../store/reducers.ts';
import {
    getParserSettings,
    getRevision,
    canSaveCode,
    canSaveTransform,
} from '../../store/selectors.ts';

export function getParser(state: RootState) {
    return getParserByID(state.workbench.parser);
}

export function getTransformer(state: RootState) {
    return getTransformerByID(state.workbench.transform.transformer);
}

const didParserSettingsChange = createSelector([
    getParserSettings,
    getRevision,
    getParser,
], (parserSettings, revision, parser) => {
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
], (revision, canSaveCodeVal, canSaveTransformVal, didParserSettingsChange) => {
    if (revision && !revision.canSave())
        return false;
    
    return canSaveCodeVal || canSaveTransformVal || didParserSettingsChange;
});
