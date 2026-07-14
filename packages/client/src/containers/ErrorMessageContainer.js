import {connect} from 'react-redux';
import ErrorMessage from '../components/ErrorMessage.js';
import {clearError} from '../store/actions.js';
import {getError} from '../store/selectors.js';

function mapStateToProps(state) {
    return {
        error: getError(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onWantToClose: () => dispatch(clearError()),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(ErrorMessage);
