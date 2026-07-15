import PropTypes from 'prop-types';
import stringify from 'json-stringify-safe';
import JSONEditor from '../JSONEditor.js';

export default function JSON({parseResult}) {
    return (
        <JSONEditor
            className="container"
            value={stringify(parseResult.ast, null, 4)}
        />
    );
}

JSON.propTypes = {
    parseResult: PropTypes.object,
};
