import PropTypes from 'prop-types';

export default function SaveButton({saving, forking, onNew}) {
    return (
        <button
            type="button"
            disabled={saving || forking}
            onClick={onNew}
        >
            <i className="fa fa-file-o fa-fw"/> New
        </button>
    );
}

SaveButton.propTypes = {
    saving: PropTypes.bool,
    forking: PropTypes.bool,
    onNew: PropTypes.func,
};
