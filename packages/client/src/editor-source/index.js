import {useSelector, useDispatch} from 'react-redux';
import {getParser} from '#parser';
import {Editor} from '#editor';
import {
    getCode,
    getParseResult,
    getKeyMap,
    getHighlightRange,
    setCode,
    setCursor,
    editorBlur,
} from '#store';

export default function EditorSource() {
    const keyMap = useSelector(getKeyMap);
    const value = useSelector(getCode);
    const parser = useSelector(getParser);
    
    if (!parser) {
        throw Error('Parser not found');
    }
    
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
