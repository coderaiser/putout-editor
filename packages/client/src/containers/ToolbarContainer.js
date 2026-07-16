import {connect} from 'react-redux';
import Toolbar from '../components/Toolbar.js';
import * as selectors from '../store/selectors.js';
import * as parserSelectors from '../store/parserSelectors.js';
import {logEvent} from '../utils/logger.js';
import {
    save,
    openSettingsDialog,
    openShareDialog,
    selectTransformer,
    hideTransformer,
    setParser,
    reset,
    setKeyMap,
} from '../store/actions.js';

function mapStateToProps(state) {
    const parser = parserSelectors.getParser(state);
    
    return {
        forking: selectors.isForking(state),
        saving: selectors.isSaving(state),
        canSave: parserSelectors.canSave(state),
        canFork: selectors.canFork(state),
        category: parser.category,
        parser,
        transformer: parserSelectors.getTransformer(state),
        keyMap: selectors.getKeyMap(state),
        showTransformer: selectors.showTransformer(state),
        snippet: selectors.getRevision(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onParserChange: (parser) => {
            dispatch(setParser(parser));
            logEvent('parser', 'select', parser.id);
        },
        onParserSettingsButtonClick: () => {
            dispatch(openSettingsDialog());
            logEvent('parser', 'open_settings');
        },
        onShareButtonClick: () => {
            dispatch(openShareDialog());
            logEvent('ui', 'open_share');
        },
        onTransformChange: (transformer) => {
            dispatch(transformer ? selectTransformer(transformer) : hideTransformer());
            
            if (transformer)
                logEvent('tool', 'select', transformer.id);
        },
        onKeyMapChange: (keyMap) => {
            dispatch(setKeyMap(keyMap));
            
            if (keyMap)
                logEvent('keyMap', keyMap);
        },
        onSave: () => dispatch(save(false)),
        onFork: () => dispatch(save(true)),
        onNew: () => {
            if (globalThis.location.hash) {
                globalThis.location.hash = '';
                return;
            }
            
            dispatch(reset());
        },
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Toolbar);
