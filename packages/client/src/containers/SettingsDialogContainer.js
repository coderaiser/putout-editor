import {connect} from 'react-redux';
import {
    closeSettingsDialog,
    setParserSettings,
} from '../store/actions.js';
import {
    showSettingsDialog,
    getParserSettings,
} from '../store/selectors.js';
import {getParser} from '../store/parserSelectors.js';
import SettingsDialog from '../components/dialogs/SettingsDialog.js';

function mapStateToProps(state) {
    return {
        visible: showSettingsDialog(state),
        parser: getParser(state),
        parserSettings: getParserSettings(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onSave: (parser, newSettings) => dispatch(setParserSettings(newSettings)),
        onWantToClose: () => dispatch(closeSettingsDialog()),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SettingsDialog);
