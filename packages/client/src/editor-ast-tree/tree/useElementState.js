import {useState} from 'react';

export default function useElementState(props, treeAdapter) {
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
    
    const [state, setState] = useState({
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
