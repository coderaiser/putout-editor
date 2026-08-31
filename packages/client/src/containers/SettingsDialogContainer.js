import {useSelector, useDispatch} from 'react-redux';
import SettingsDialog from '../parser-selection/dialogs/SettingsDialog.js';
import {
    closeSettingsDialog,
    setParserSettings,
} from '../store/reducers.ts';
import {
    showSettingsDialog,
    getParserSettings,
} from '../store/selectors.ts';
import {getParser} from '../parser-selection/store/parserSelectors.ts';

export default function SettingsDialogContainer() {
    const visible = useSelector(showSettingsDialog);
    const parser = useSelector(getParser);
    const parserSettings = useSelector(getParserSettings);
    const dispatch = useDispatch();
    
    return (
        <SettingsDialog
            visible={visible}
            parser={parser}
            parserSettings={parserSettings}
            onSave={(parser, newSettings) => dispatch(setParserSettings(newSettings))}
            onWantToClose={() => dispatch(closeSettingsDialog())}
        />
    );
}
