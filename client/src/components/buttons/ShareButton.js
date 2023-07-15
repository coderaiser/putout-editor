import PropTypes from 'prop-types';
import React from 'react';

export default function ShareButton({onShareButtonClick, snippet}) {
    return (
        <button
            type="button"
            disabled={!snippet}
            onClick={onShareButtonClick}
        >
            <i className="fa fa-share fa-fw"/> Share...
        </button>
    );
}

ShareButton.propTypes = {
    onShareButtonClick: PropTypes.func.isRequired,
    snippet: PropTypes.object,
};
