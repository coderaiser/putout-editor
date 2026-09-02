import PropTypes from 'prop-types';

export default function ElementName({name, computed, showToggler, onClick}) {
    if (!name)
        return null;

    return (
        <span className="key" onClick={showToggler ? onClick : null}>
            <span className="name nb">
                {computed ? <span title="computed">*{name}</span> : name}
            </span>
            <span className="p">:&nbsp;</span>
        </span>
    );
}

ElementName.propTypes = {
    name: PropTypes.string,
    computed: PropTypes.bool,
    showToggler: PropTypes.bool,
    onClick: PropTypes.func,
};