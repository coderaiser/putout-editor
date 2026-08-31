import PropTypes from 'prop-types';

export default function CompactArrayView({array, onClick}) {
    const count = array.length;
    
    if (!count)
        return (
            <span className="p">{'[ ]'}</span>
        );
    
    return (
        <span>
            <span className="p">{'['}</span>
            <span className="compact placeholder ge" onClick={onClick}>
                {count + ' element' + (count > 1 ? 's' : '')}
            </span>
            <span className="p">{']'}</span>
        </span>
    );
}

CompactArrayView.propTypes = {
    /**
     * The array of elements to represent.
     */
    array: PropTypes.oneOfType([PropTypes.array, PropTypes.shape({
        length: PropTypes.number,
    })]).isRequired,
    onClick: PropTypes.func,
};
