import {useSelector, useDispatch} from 'react-redux';
import EditorResult from '#editor-result';
import {Editor} from '#editor';
import {SplitPane} from '#ui';
import {
    setTransformState,
    transformBlur,
    getTransformCode,
    getCode,
    getKeyMap,
    isLoadingSnippet,
} from '#store';
import {
    getTransformerByID,
    getParser,
    getTransformer,
} from '#parser';
import {
    getHighlightRange,
} from '../store/selectors.ts';

export default function EditorPlugin() {
    const parser = useSelector(getParser);
    const transformer = useSelector(getTransformer) || getTransformerByID('putout');
    const transformCode = useSelector(getTransformCode);
    const code = useSelector(getCode);
    const keyMap = useSelector(getKeyMap);
    const isLoading = useSelector(isLoadingSnippet);
    const highlightRange = useSelector(getHighlightRange);
    const mode = parser.category.editorMode || parser.category.id;
    const dispatch = useDispatch();
    
    return (
        <SplitPane className="splitpane">
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
            <EditorResult
                transformer={transformer}
                transformCode={transformCode}
                code={code}
                mode={mode}
                keyMap={keyMap}
                parser={parser.id}
                isLoading={isLoading}
                highlightRange={highlightRange}
            />
        </SplitPane>
    );
}
