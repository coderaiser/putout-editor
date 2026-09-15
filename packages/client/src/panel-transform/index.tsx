import {useSelector} from 'react-redux';
import EditorPlugin from '../editor-transform/index.tsx';
import {showTransformer} from '#store';

export default function TransformPanel() {
    const show = useSelector(showTransformer);
    
    if (!show)
        return null;
    
    return (
        <EditorPlugin/>
    );
}
