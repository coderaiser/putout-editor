import {useSelector, useDispatch} from 'react-redux';
import Toolbar from '../components/Toolbar.js';
import * as selectors from '../store/selectors.js';
import * as parserSelectors from '../store/parserSelectors.js';
import {logEvent} from '../utils/logger.js';
import {
    openSettingsDialog,
    openShareDialog,
    selectTransformer,
    hideTransformer,
    setParser,
    reset,
    setKeyMap,
} from '../store/reducers.js';

export default function ToolbarContainer() {
    const forking = useSelector(selectors.isForking);
    const saving = useSelector(selectors.isSaving);
    const canSave = useSelector(parserSelectors.canSave);
    const canFork = useSelector(selectors.canFork);
    const parser = useSelector(parserSelectors.getParser);
    const transformer = useSelector(parserSelectors.getTransformer);
    const keyMap = useSelector(selectors.getKeyMap);
    const showTransformerVal = useSelector(selectors.showTransformer);
    const snippet = useSelector(selectors.getRevision);
    const dispatch = useDispatch();
    
    return (
        <Toolbar
            forking={forking}
            saving={saving}
            canSave={canSave}
            canFork={canFork}
            category={parser.category}
            parser={parser}
            transformer={transformer}
            keyMap={keyMap}
            showTransformer={showTransformerVal}
            snippet={snippet}
            onParserChange={(parser) => {
                dispatch(setParser(parser));
                logEvent('parser', 'select', parser.id);
            }}
            onParserSettingsButtonClick={() => {
                dispatch(openSettingsDialog());
                logEvent('parser', 'open_settings');
            }}
            onShareButtonClick={() => {
                dispatch(openShareDialog());
                logEvent('ui', 'open_share');
            }}
            onTransformChange={(transformer) => {
                dispatch(transformer ? selectTransformer(transformer) : hideTransformer());
                
                if (transformer)
                    logEvent('tool', 'select', transformer.id);
            }}
            onKeyMapChange={(keyMap) => {
                dispatch(setKeyMap(keyMap));
                
                if (keyMap)
                    logEvent('keyMap', keyMap);
            }}
            onSave={() => dispatch({
                type: 'snippet/save',
                payload: false,
            })}
            onFork={() => dispatch({
                type: 'snippet/save',
                payload: true,
            })}
            onNew={() => {
                if (globalThis.location.hash) {
                    globalThis.location.hash = '';
                    return;
                }
                
                dispatch(reset());
            }}
        />
    );
}
