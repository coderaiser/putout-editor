import {useSelector} from 'react-redux';
import EditorPlugin from '../editor-transform/index.tsx';

export default function TransformPanel() {
    const showTransformer = useSelector((state: any) => state.showTransformPanel);
    
    if (!showTransformer)
        return null;
    
    return (
        <EditorPlugin/>
    );
}
