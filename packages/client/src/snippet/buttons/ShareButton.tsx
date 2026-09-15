import PropTypes from 'prop-types';
import {TbShare2} from 'react-icons/tb';
import type {Revision} from '../../store/reducers.ts';

interface ShareButtonProps {
    onShareButtonClick?: () => void;
    onShare?: () => void;
    snippet: Revision | null;
}

export default function ShareButton({onShareButtonClick, onShare, snippet}: ShareButtonProps) {
    return (
        <button
            type="button"
            disabled={!snippet}
            onClick={onShareButtonClick || onShare}
        >
            <TbShare2 size={18}/> Share...
        </button>
    );
}

ShareButton.propTypes = {
    onShareButtonClick: PropTypes.func,
    onShare: PropTypes.func,
    snippet: PropTypes.object,
};
