import {connect} from 'react-redux';
import {closeShareDialog} from '../store/actions.js';
import {
    showShareDialog,
    getRevision,
} from '../store/selectors.js';
import ShareDialog from '../components/dialogs/ShareDialog.js';

function mapStateToProps(state) {
    return {
        visible: showShareDialog(state),
        snippet: getRevision(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onWantToClose: () => dispatch(closeShareDialog()),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(ShareDialog);
