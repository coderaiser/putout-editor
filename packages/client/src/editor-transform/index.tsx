import {useSelector, useDispatch} from 'react-redux';
import {Editor} from '#editor';
import {
    setTransformState,
    transformBlur,
    getTransformCode,
    getKeyMap,
    getFormatError,
} from '#store';

export default function EditorPlugin() {
    const transformCode = useSelector(getTransformCode);
    const keyMap = useSelector(getKeyMap);
    const formatError = useSelector(getFormatError);
    const dispatch = useDispatch();
    
    return (
        <div data-name="editor-transform" data-testid="editor-transform">
            <Editor
                highlight={false}
                value={transformCode}
                onContentChange={({value, cursor}: {value: string;cursor: number;}) => dispatch(setTransformState({
                    code: value,
                    cursor,
                }))}
                onBlur={() => dispatch(transformBlur())}
                keyMap={keyMap}
            />
            {formatError && <pre
                className="format-error"
                data-testid="format-error"
            >
                {formatError}
            </pre>}
        </div>
    );
}
