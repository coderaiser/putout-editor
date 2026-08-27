import {useSelector, useDispatch} from 'react-redux';
import ErrorMessage from '../components/ErrorMessage.js';
import {clearError} from '../store/actions.js';
import {getError} from '../store/selectors.js';

export default function ErrorMessageContainer() {
    const error = useSelector(getError);
    const dispatch = useDispatch();
    
    return (
        <ErrorMessage error={error} onWantToClose={() => dispatch(clearError())}/>
    );
}
