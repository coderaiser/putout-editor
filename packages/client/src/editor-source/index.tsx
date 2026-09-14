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

    if (!parser)
        throw Error('Parser not found');

    const mode = parser.category.editorMode || parser.category.id;
    const error = useSelector((state: any) => (getParseResult(state) || {}).error);
    const highlightRange = useSelector(getHighlightRange);
    const dispatch = useDispatch();

    return (
        <div data-name="editor-source" data-testid="editor-source">
            <Editor
                keyMap={keyMap}
                value={value}
                mode={mode}
                error={error}
                highlightRange={highlightRange as [number, number] | null}
                onContentChange={({value, cursor}: {value: string; cursor: number}) => dispatch(setCode({
                    code: value,
                    cursor,
                }))}
                onActivity={(cursor: number) => dispatch(setCursor(cursor))}
                onBlur={() => dispatch(editorBlur())}
            />
        </div>
    );
}