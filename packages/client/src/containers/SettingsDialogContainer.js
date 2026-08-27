import {useSelector, useDispatch} from 'react-redux';
import SettingsDialog from '../components/dialogs/SettingsDialog.js';
import {
    closeSettingsDialog,
    setParserSettings,
} from '../store/actions.js';
import {
    showSettingsDialog,
    getParserSettings,
} from '../store/selectors.js';
import {getParser} from '../store/parserSelectors.js';

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
