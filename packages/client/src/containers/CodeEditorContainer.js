import {useSelector, useDispatch} from 'react-redux';
import Editor from '../components/Editor.js';
import {
    getCode,
    getParseResult,
    getKeyMap,
} from '../store/selectors.js';
import {getParser} from '../store/parserSelectors.js';
import {setCode, setCursor} from '../store/reducers.js';

export default function CodeEditorContainer() {
    const keyMap = useSelector(getKeyMap);
    const value = useSelector(getCode);
    const parser = useSelector(getParser);
    const mode = parser.category.editorMode || parser.category.id;
    const error = useSelector((s) => (getParseResult(s) || {}).error);
    const dispatch = useDispatch();
    
    return (
        <Editor
            keyMap={keyMap}
            value={value}
            mode={mode}
            error={error}
            onContentChange={({value, cursor}) => {
                dispatch(setCode({
                    code: value,
                    cursor,
                }));
            }}
            onActivity={(cursor) => dispatch(setCursor(cursor))}
        />
    );
}
