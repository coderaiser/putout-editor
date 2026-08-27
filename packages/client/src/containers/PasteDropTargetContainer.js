import {useDispatch} from 'react-redux';
import PasteDropTarget from '../components/PasteDropTarget.js';
import {setError, dropText} from '../store/actions.js';

export default function PasteDropTargetContainer({children}) {
    const dispatch = useDispatch();
    return (
        <PasteDropTarget
            onText={(type, event, code, categoryId) => {
                dispatch(dropText(code, categoryId));
            }}
            onError={(error) => dispatch(setError(error))}
        >
            {children}
        </PasteDropTarget>
    );
}
