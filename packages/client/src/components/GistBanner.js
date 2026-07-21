/*
 * Data storage is moved from Parse to Gists. It won't be possible anymore to
 * save new revisions of existing Parse snippets. We let the visitor know.
 */
import {
    useState,
    useEffect,
    useRef,
} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {getRevision} from '../store/selectors.js';

const buttonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    float: 'left',
    fontSize: 14,
    margin: 0,
    padding: 0,
    paddingRight: 10,
};

function GistBanner({revision}) {
    const [visible, setVisible] = useState(true);
    const prevRevisionRef = useRef(revision);
    
    useEffect(() => {
        const prev = prevRevisionRef.current;
        
        if (revision && (!prev || revision.getSnippetID() !== prev.getSnippetID()))
            setVisible(true);
        
        prevRevisionRef.current = revision;
    }, [revision]);
    
    if (!visible)
        return null;
    
    if (!revision || revision.canSave())
        return null;
    
    return (
        <div className="banner">
            This snippet is <strong>read-only</strong>. You can still save changes
            by forking it.
            <button style={buttonStyle} onClick={() => setVisible(false)}>
                <i className="fa fa-times" aria-hidden="true"></i>
            </button>
        </div>
    );
}

GistBanner.propTypes = {
    revision: PropTypes.object,
};

export default connect((state) => ({
    revision: getRevision(state),
}))(GistBanner);
