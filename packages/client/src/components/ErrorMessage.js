import PropTypes from 'prop-types';
import {TbAlertTriangle} from 'react-icons/tb';

export default function ErrorMessage({error, onWantToClose}) {
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
                        onClick={onWantToClose}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}

ErrorMessage.propTypes = {
    error: PropTypes.object,
    onWantToClose: PropTypes.func,
};
