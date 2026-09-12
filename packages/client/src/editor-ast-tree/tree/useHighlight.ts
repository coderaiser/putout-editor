import {useDispatch} from 'react-redux';
import {setHighlight, clearHighlight} from '../../store/reducers.ts';
import type {TreeAdapter} from './types.ts';

export default function useHighlight(treeAdapter: TreeAdapter, value: unknown) {
    const dispatch = useDispatch();
    const range = treeAdapter.getRange(value);
    
    function onMouseOver(event: React.MouseEvent) {
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
