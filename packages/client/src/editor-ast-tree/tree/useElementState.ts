import {useState} from 'react';
import type {
    ElementProps,
    ElementState,
    TreeAdapter,
} from './types.ts';

export default function useElementState(props: ElementProps, treeAdapter: TreeAdapter): [
    ElementState,
    React.Dispatch<React.SetStateAction<ElementState>>,
] {
    const {
        value,
        deepOpen,
        focusPath,
        level,
        open,
    } = props;
    
    const isInFocusPath = focusPath.indexOf(value) > -1;
    const isLeafInFocusPath = focusPath.at(-1) === value;
    const openFromFocusPath = isInFocusPath && !isLeafInFocusPath;
    
    const [state, setState] = useState<ElementState>({
        open: open || !level || deepOpen || openFromFocusPath || value && treeAdapter.opensByDefault(value, props.name),
        deepOpen,
        value,
        error: null,
    });
    
    const [previousProps, setPreviousProps] = useState(props);
    
    if (props !== previousProps) {
        setPreviousProps(props);
        setState((current) => ({
            ...current,
            open: open || props.deepOpen || current.open,
            deepOpen: props.deepOpen,
            value: props.value,
        }));
    }
    
    return [state, setState];
}
