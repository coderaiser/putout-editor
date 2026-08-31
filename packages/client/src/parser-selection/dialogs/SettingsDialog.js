import {useState, useEffect} from 'react';
import PropTypes from 'prop-types';

export default function SettingsDialog({visible, parser, parserSettings, onSave, onWantToClose}) {
    const [localSettings, setLocalSettings] = useState(parserSettings);
    
    useEffect(() => {
        setLocalSettings(parserSettings);
    }, [parserSettings]);
    
    function handleOuterClick(event) {
        if (event.target === document.getElementById('SettingsDialog'))
            handleSaveAndClose();
    }
    
    function handleChange(newSettings) {
        setLocalSettings(newSettings);
    }
    
    function handleSaveAndClose() {
        onSave(parser, localSettings);
        onWantToClose();
    }
    
    function handleReset() {
        setLocalSettings({});
    }
    
    if (visible && parser.renderSettings)
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

SettingsDialog.propTypes = {
    onSave: PropTypes.func,
    onWantToClose: PropTypes.func,
    visible: PropTypes.bool,
    parser: PropTypes.object.isRequired,
    parserSettings: PropTypes.object,
};
