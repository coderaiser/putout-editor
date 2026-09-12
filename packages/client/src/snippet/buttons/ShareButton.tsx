import PropTypes from 'prop-types';
import {TbShare2} from 'react-icons/tb';

interface ShareButtonProps {
    onShareButtonClick?: () => void;
    onShare?: () => void;
    snippet?: any;
}

export default function ShareButton({onShareButtonClick, onShare, snippet}: ShareButtonProps) {
    const onClick = onShareButtonClick || onShare || (() => {});
    return (
        <button
            type="button"
            disabled={!snippet}
            onClick={onClick}
        >
            <TbShare2 size={18}/> Share...
        </button>
    );
}

ShareButton.propTypes = {
    onShareButtonClick: PropTypes.func,
    onShare: PropTypes.func,
    snippet: PropTypes.object,
};
