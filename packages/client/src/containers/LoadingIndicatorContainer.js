import {connect} from 'react-redux';
import LoadingIndicator from '../components/LoadingIndicator.js';
import {isLoadingSnippet} from '../store/selectors.js';

function mapStateToProps(state) {
    return {
        visible: isLoadingSnippet(state),
    };
}

export default connect(mapStateToProps)(LoadingIndicator);
