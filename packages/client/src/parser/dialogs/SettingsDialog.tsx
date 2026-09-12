import {useState, useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {
    closeSettingsDialog,
    setParserSettings,
} from '../../store/reducers.ts';
import {
    showSettingsDialog,
    getParserSettings,
} from '../../store/selectors.ts';
import {getParser} from '../store/parserSelectors.ts';
import type {ParserInfo} from '../parsers/index.ts';

interface ParserWithRenderSettings extends ParserInfo {
    renderSettings?: (settings: Record<string, unknown>, onChange: (settings: Record<string, unknown>) => void) => React.ReactElement | null;
}

export default function SettingsDialog() {
    const visible = useSelector(showSettingsDialog);
    const parser = useSelector(getParser) as ParserWithRenderSettings | undefined;
    const parserSettings = useSelector(getParserSettings);
    const dispatch = useDispatch();
    
    const [localSettings, setLocalSettings] = useState(parserSettings);
    
    useEffect(() => {
        setLocalSettings(parserSettings);
    }, [parserSettings]);
    
    function handleOuterClick(event: React.MouseEvent<HTMLDivElement>) {
        if (event.target === document.getElementById('SettingsDialog'))
            handleSaveAndClose();
    }
    
    function handleChange(newSettings: Record<string, unknown>) {
        setLocalSettings(newSettings);
    }
    
    function handleSaveAndClose() {
        dispatch(setParserSettings(localSettings));
        dispatch(closeSettingsDialog());
    }
    
    function handleReset() {
        setLocalSettings({});
    }
    
    if (visible && parser?.renderSettings)
        return (
            <div id="SettingsDialog" className="dialog" onClick={handleOuterClick}>
                <div className="inner">
                    <div className="header">
                        <h3>{parser.displayName} Settings</h3>
                    </div>
                    <div className="body">
                        {parser.renderSettings(localSettings, handleChange)}
                    </div>
                    <div className="footer">
                        <button
                            style={{
                                marginRight: 10,
                            }}
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                        <button onClick={handleSaveAndClose}>Close</button>
                    </div>
                </div>
            </div>
        );
    
    return null;
}
