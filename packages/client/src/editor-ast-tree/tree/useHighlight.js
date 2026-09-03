import {useDispatch} from 'react-redux';
import {setHighlight, clearHighlight} from '../../store/reducers.ts';

export default function useHighlight(treeAdapter, value) {
    const dispatch = useDispatch();
    const range = treeAdapter.getRange(value);
    
    function onMouseOver(event) {
        event.stopPropagation();
        
        if (!range)
            return;
        
        dispatch(setHighlight(range));
    }
    
    function onMouseLeave() {
        dispatch(clearHighlight(range));
    }
    
    return {
        onMouseOver,
        onMouseLeave,
    };
}
