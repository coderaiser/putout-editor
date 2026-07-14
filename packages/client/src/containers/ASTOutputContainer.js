import {connect} from 'react-redux';
import ASTOutput from '../components/ASTOutput.js';
import {getParser} from '../store/parserSelectors.js';
import {getParseResult, getCursor} from '../store/selectors.js';

function mapStateToProps(state) {
    return {
        parser: getParser(state),
        parseResult: getParseResult(state),
        cursor: getCursor(state),
    };
}

export default connect(mapStateToProps)(ASTOutput);
