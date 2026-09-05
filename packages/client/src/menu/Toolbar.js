import {useSelector, useDispatch} from 'react-redux';
import {TbQuestionMark} from 'react-icons/tb';
import ParserButton from '../parser/buttons/ParserButton.js';
import SnippetButton from '../snippet/buttons/SnippetButton.js';
import TransformButton from '../editor-transform/TransformButton.js';
import KeyMapButton from './KeyMapButton.js';
import ThemeButton from './ThemeButton.js';
import Funding from './Funding.js';
import {getTransformerByID} from '../parser/parsers/index.js';
import * as selectors from '../store/selectors.ts';
import * as parserSelectors from '../parser/store/parserSelectors.ts';
import {logEvent} from '../snippet/logger.ts';
import {
    openSettingsDialog,
    openShareDialog,
    selectTransformer,
    hideTransformer,
    setParser,
    reset,
    setKeyMap,
} from '../store/reducers.ts';

export default function Toolbar() {
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
    
    const onParserChange = (parser) => {
        dispatch(setParser(parser));
        logEvent('parser', 'select', parser.id);
    };
    
    const onParserSettingsButtonClick = () => {
        dispatch(openSettingsDialog());
        logEvent('parser', 'open_settings');
    };
    
    const onShareButtonClick = () => {
        dispatch(openShareDialog());
        logEvent('ui', 'open_share');
    };
    
    const onTransformChange = (transformer) => {
        dispatch(transformer ? selectTransformer(transformer) : hideTransformer());
        
        if (transformer)
            logEvent('tool', 'select', transformer.id);
    };
    
    const onKeyMapChange = (keyMap) => {
        dispatch(setKeyMap(keyMap));
        
        if (keyMap)
            logEvent('keyMap', keyMap);
    };
    
    const onSave = () => dispatch({
        type: 'snippet/save',
        payload: false,
    });
    
    const onFork = () => dispatch({
        type: 'snippet/save',
        payload: true,
    });
    
    const onNew = () => {
        if (globalThis.location.hash) {
            globalThis.location.hash = '';
            return;
        }
        
        dispatch(reset());
    };
    
    let parserInfo = parser.displayName;
    let transformerInfo = '';
    
    if (parser) {
        if (parser.version)
            parserInfo += '-' + parser.version;
        
        if (parser.homepage)
            parserInfo = <a href={parser.homepage} target="_blank" rel="noopener noreferrer">{parserInfo}</a>;
    }
    
    if (showTransformerVal) {
        const displayTransformer = transformer || getTransformerByID('putout');
        
        transformerInfo = displayTransformer.displayName;
        
        if (displayTransformer.version)
            transformerInfo += '-' + displayTransformer.version;
        
        if (displayTransformer.homepage)
            transformerInfo = <a href={displayTransformer.homepage} target="_blank" rel="noopener noreferrer">{transformerInfo}</a>;
        
        transformerInfo = <span>Transformer: {transformerInfo}</span>;
    }
    
    return (
        <div id="Toolbar">
            <h1>🐊Putout Editor</h1>
            <SnippetButton
                canSave={canSave}
                canFork={canFork}
                saving={saving}
                forking={forking}
                snippet={snippet}
                onSave={onSave}
                onFork={onFork}
                onNew={onNew}
                onShareButtonClick={onShareButtonClick}
            />
            <ParserButton
                parser={parser}
                category={parser.category}
                onParserChange={onParserChange}
                onParserSettingsButtonClick={onParserSettingsButtonClick}
            />
            <TransformButton
                category={parser.category}
                transformer={transformer}
                showTransformer={showTransformerVal}
                onTransformChange={onTransformChange}
            />
            <KeyMapButton
                keyMap={keyMap}
                onKeyMapChange={onKeyMapChange}
            />
            <a
                style={{
                    minWidth: 0,
                }}
                target="_blank"
                rel="noopener noreferrer"
                title="Help"
                href="https://github.com/coderaiser/putout#-plugins-api"
            >
                <TbQuestionMark size={18}/>
            </a>
            <ThemeButton/>
            <Funding/>
            <div id="info" className={transformerInfo ? 'small' : ''}>
                Parser: {parserInfo}<br/>
                {transformerInfo}
            </div>
        </div>
    );
}
