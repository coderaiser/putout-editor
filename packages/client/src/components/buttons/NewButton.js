import PropTypes from 'prop-types';
import {TbFilePlus} from 'react-icons/tb';

export default function SaveButton({saving, forking, onNew}) {
    return (
        <button
            type="button"
            disabled={saving || forking}
            onClick={onNew}
        >
            <TbFilePlus size={18}/> New
        </button>
    );
}

SaveButton.propTypes = {
    saving: PropTypes.bool,
    forking: PropTypes.bool,
    onNew: PropTypes.func,
};
