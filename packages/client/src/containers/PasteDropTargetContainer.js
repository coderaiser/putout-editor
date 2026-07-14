import {connect} from 'react-redux';
import PasteDropTarget from '../components/PasteDropTarget.js';
import {setError, dropText} from '../store/actions.js';

function mapDispatchToProps(dispatch) {
    return {
        onText: (type, event, code, categoryId) => {
            dispatch(dropText(code, categoryId));
        },
        onError: (error) => dispatch(setError(error)),
    };
}

export default connect(
    null,
    mapDispatchToProps,
)(PasteDropTarget);
