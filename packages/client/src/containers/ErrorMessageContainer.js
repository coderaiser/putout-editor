import {useSelector, useDispatch} from 'react-redux';
import ErrorMessage from '../components/ErrorMessage.js';
import {clearError} from '../store/reducers.ts';
import {getError} from '../store/selectors.ts';

export default function ErrorMessageContainer() {
    const error = useSelector(getError);
    const dispatch = useDispatch();
    
    return (
        <ErrorMessage error={error} onWantToClose={() => dispatch(clearError())}/>
    );
}
