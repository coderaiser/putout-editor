import {useSelector, useDispatch} from 'react-redux';
import Editor from '../editor/Editor.js';
import SplitPane from '../ui/SplitPane.js';
import TransformOutput from '../editor-output/TransformOutput.js';
import {getTransformerByID} from '../parser/parsers/index.js';
import {
    setTransformState,
    transformBlur,
} from '../store/reducers.ts';
import {getParser, getTransformer} from '../parser/store/parserSelectors.ts';
import * as selectors from '../store/selectors.ts';

export default function Transformer() {
    const parser = useSelector(getParser);
    const transformer = useSelector(getTransformer) || getTransformerByID('putout');
    const transformCode = useSelector(selectors.getTransformCode);
    const code = useSelector(selectors.getCode);
    const keyMap = useSelector(selectors.getKeyMap);
    const isLoading = useSelector(selectors.isLoadingSnippet);
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
            <TransformOutput
                transformer={transformer}
                transformCode={transformCode}
                code={code}
                mode={mode}
                keyMap={keyMap}
                parser={parser.id}
                isLoading={isLoading}
            />
        </SplitPane>
    );
}
