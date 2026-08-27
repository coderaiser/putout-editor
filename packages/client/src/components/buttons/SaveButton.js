import PropTypes from 'prop-types';
import {TbDeviceFloppy, TbLoader2} from 'react-icons/tb';

export default function SaveButton({canSave, saving, forking, onSave}) {
    return (
        <button
            type="button"
            disabled={!canSave || saving || forking}
            onClick={onSave}
        >
            {saving
                ? <TbLoader2 size={18}/>
                : <TbDeviceFloppy size={18}/>} Save
        </button>
    );
}

SaveButton.propTypes = {
    canSave: PropTypes.bool,
    saving: PropTypes.bool,
    forking: PropTypes.bool,
    onSave: PropTypes.func,
};
