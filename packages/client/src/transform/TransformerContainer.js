import {useSelector, useDispatch} from 'react-redux';
import Transformer from './Transformer.js';
import {
    setTransformState,
    transformBlur,
} from '../store/reducers.ts';
import {getParser, getTransformer} from '../parser-selection/store/parserSelectors.ts';
import * as selectors from '../store/selectors.ts';

export default function TransformerContainer() {
    const parser = useSelector(getParser);
    const transformer = useSelector(getTransformer);
    const defaultTransformCode = useSelector(selectors.getInitialTransformCode);
    const transformCode = useSelector(selectors.getTransformCode);
    const code = useSelector(selectors.getCode);
    const keyMap = useSelector(selectors.getKeyMap);
    const isLoading = useSelector(selectors.isLoadingSnippet);
    const mode = parser.category.editorMode || parser.category.id;
    const dispatch = useDispatch();
    
    return (
        <Transformer
            parser={parser.id}
            transformer={transformer}
            defaultTransformCode={defaultTransformCode}
            transformCode={transformCode}
            code={code}
            mode={mode}
            keyMap={keyMap}
            isLoading={isLoading}
            onContentChange={({value, cursor}) => {
                dispatch(setTransformState({
                    code: value,
                    cursor,
                }));
            }}
            onBlur={() => dispatch(transformBlur())}
        />
    );
}
