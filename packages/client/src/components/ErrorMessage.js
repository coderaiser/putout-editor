import PropTypes from 'prop-types';

export default function ErrorMessage({error, onWantToClose}) {
    if (!error)
        return null;
    
    return (
        <div className="cover">
            <div className="errorMessage">
                <h3>
                    <i className="fa fa-exclamation-triangle"></i>
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
