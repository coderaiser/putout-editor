import {useSelector, useDispatch} from 'react-redux';
import Transformer from '../components/Transformer.js';
import {
    setTransformState,
    toggleFormatting,
} from '../store/actions.js';
import {getParser, getTransformer} from '../store/parserSelectors.js';
import * as selectors from '../store/selectors.js';

export default function TransformerContainer() {
    const parser = useSelector(getParser);
    const transformer = useSelector(getTransformer);
    const defaultTransformCode = useSelector(selectors.getInitialTransformCode);
    const transformCode = useSelector(selectors.getTransformCode);
    const code = useSelector(selectors.getCode);
    const enableFormatting = useSelector(selectors.getFormattingState);
    const keyMap = useSelector(selectors.getKeyMap);
    const mode = parser.category.editorMode || parser.category.id;
    const dispatch = useDispatch();
    
    return (
        <Transformer
            parser={parser}
            transformer={transformer}
            defaultTransformCode={defaultTransformCode}
            transformCode={transformCode}
            code={code}
            mode={mode}
            enableFormatting={enableFormatting}
            keyMap={keyMap}
            onContentChange={({value, cursor}) => {
                dispatch(setTransformState({
                    code: value,
                    cursor,
                }));
            }}
            toggleFormatting={() => {
                dispatch(toggleFormatting());
            }}
        />
    );
}
