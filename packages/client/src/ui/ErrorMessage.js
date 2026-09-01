import {useSelector, useDispatch} from 'react-redux';
import {TbAlertTriangle} from 'react-icons/tb';
import {clearError} from '../store/reducers.ts';
import {getError} from '../store/selectors.ts';

export default function ErrorMessage() {
    const error = useSelector(getError);
    const dispatch = useDispatch();
    
    if (!error)
        return null;
    
    return (
        <div className="cover">
            <div className="errorMessage">
                <h3>
                    <TbAlertTriangle size={18}/>
                    {' '}
                    Error
                </h3>
                <div>{error.message}</div>
                <div
                    style={{
                        marginTop: 15,
                    }}
                >
                    <button
                        type="button"
                        onClick={() => dispatch(clearError())}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
