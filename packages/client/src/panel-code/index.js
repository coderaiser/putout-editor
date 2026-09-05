import {useSelector} from 'react-redux';
import EditorResult from '#editor-result';
import {
    getTransformCode,
    getCode,
    getKeyMap,
    isLoadingSnippet,
} from '#store';
import {
    getParser,
    getTransformer,
    getTransformerByID,
} from '#parser';

export default function CodePanel() {
    const parser = useSelector(getParser);
    const transformer = useSelector(getTransformer) || getTransformerByID('putout');
    const transformCode = useSelector(getTransformCode);
    const code = useSelector(getCode);
    const keyMap = useSelector(getKeyMap);
    const isLoading = useSelector(isLoadingSnippet);
    const mode = parser.category.editorMode || parser.category.id;
    
    return (
        <EditorResult
            transformer={transformer}
            transformCode={transformCode}
            code={code}
            mode={mode}
            keyMap={keyMap}
            parser={parser.id}
            isLoading={isLoading}
        />
    );
}
