import {useSelector} from 'react-redux';
import EditorPlugin from '../editor-plugin/index.js';

export default function TransformPanel() {
    const showTransformer = useSelector((state) => state.showTransformPanel);
    
    if (!showTransformer)
        return null;
    
    return (
        <EditorPlugin/>
    );
}
