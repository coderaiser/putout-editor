import {useSelector} from 'react-redux';
import {showTransformer} from '#store';
import EditorPlugin from '../editor-transform/index.tsx';

export default function TransformPanel() {
    const show = useSelector(showTransformer);
    
    if (!show)
        return null;
    
    return (
        <EditorPlugin/>
    );
}
