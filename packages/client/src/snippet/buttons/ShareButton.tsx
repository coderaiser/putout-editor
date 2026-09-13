import PropTypes from 'prop-types';
import {TbShare2} from 'react-icons/tb';

interface ShareButtonProps {
    onShareButtonClick: () => void;
    snippet: any;
}

export default function ShareButton({onShareButtonClick, snippet}: ShareButtonProps) {
    return (
        <button
            type="button"
            disabled={!snippet}
            onClick={onShareButtonClick}
        >
            <TbShare2 size={18}/> Share...
        </button>
    );
}

ShareButton.propTypes = {
    onShareButtonClick: PropTypes.func.isRequired,
    snippet: PropTypes.object,
};
