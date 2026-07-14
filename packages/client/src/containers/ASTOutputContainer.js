import {connect} from 'react-redux';
import ASTOutput from '../components/ASTOutput';
import {getParser} from '../store/parserSelectors';
import {getParseResult, getCursor} from '../store/selectors';

function mapStateToProps(state) {
    return {
        parser: getParser(state),
        parseResult: getParseResult(state),
        cursor: getCursor(state),
    };
}

export default connect(mapStateToProps)(ASTOutput);
