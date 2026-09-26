import isDeepStrictEqual from '@gilbarbara/deep-equal';
import {createSelector} from '@reduxjs/toolkit';
// straight from ./reducers.ts, not the #store barrel: the barrel re-exports this
// very module, so going through it makes a cycle of its own
import type {RootState} from './reducers.ts';
import {
    getParserByID,
    getTransformerByID,
    type ParserInfoWithCategory,
    type TransformerInfo,
} from '../parser/parsers/index.ts';
import {
    getParserSettings,
    getRevision,
    canSaveCode,
    canSaveTransform,
} from './selectors.ts';

export function getParser(state: RootState): ParserInfoWithCategory {
    return getParserByID(state.workbench.parser)! as ParserInfoWithCategory;
}

export function getTransformer(state: RootState): TransformerInfo | undefined {
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
        && !isDeepStrictEqual(parserSettings, savedParserSettings));
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
