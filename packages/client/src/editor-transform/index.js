import {useSelector, useDispatch} from 'react-redux';
import {Editor} from '#editor';
import {
    setTransformState,
    transformBlur,
    getTransformCode,
    getKeyMap,
} from '#store';

export default function EditorPlugin() {
    const transformCode = useSelector(getTransformCode);
    const keyMap = useSelector(getKeyMap);
    const dispatch = useDispatch();
    
    return (
        <div>
            <Editor
                highlight={false}
                value={transformCode}
                onContentChange={({value, cursor}) => dispatch(setTransformState({
                    code: value,
                    cursor,
                }))}
                onBlur={() => dispatch(transformBlur())}
                keyMap={keyMap}
            />
        </div>
    );
}
