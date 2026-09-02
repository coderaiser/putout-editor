import {useSelector, useDispatch} from 'react-redux';
import Editor from '../editor/Editor.js';
import {getParser} from '../parser/store/parserSelectors.ts';
import {
    getCode,
    getParseResult,
    getKeyMap,
    getHighlightRange,
} from '../store/selectors.ts';
import {
    setCode,
    setCursor,
    editorBlur,
} from '../store/reducers.ts';

export default function EditorSource() {
    const keyMap = useSelector(getKeyMap);
    const value = useSelector(getCode);
    const parser = useSelector(getParser);
    const mode = parser.category.editorMode || parser.category.id;
    const error = useSelector((state) => (getParseResult(state) || {}).error);
    const highlightRange = useSelector(getHighlightRange);
    const dispatch = useDispatch();
    
    return (
        <Editor
            keyMap={keyMap}
            value={value}
            mode={mode}
            error={error}
            highlightRange={highlightRange}
            onContentChange={({value, cursor}) => dispatch(setCode({
                code: value,
                cursor,
            }))}
            onActivity={(cursor) => dispatch(setCursor(cursor))}
            onBlur={() => dispatch(editorBlur())}
        />
    );
}
