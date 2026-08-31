import {useSelector} from 'react-redux';
import ASTOutput from '../components/ASTOutput.js';
import {getParser} from '../store/parserSelectors.ts';
import {getParseResult, getCursor} from '../store/selectors.ts';

export default function ASTOutputContainer() {
    const parser = useSelector(getParser);
    const parseResult = useSelector(getParseResult);
    const cursor = useSelector(getCursor);
    
    return (
        <ASTOutput parser={parser} parseResult={parseResult} cursor={cursor}/>
    );
}
