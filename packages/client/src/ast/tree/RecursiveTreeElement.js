import {
    useEffect,
    useRef,
    useState,
} from 'react';

function shouldAutoFocus({value, settings, focusPath}) {
    return settings.autofocus && focusPath.indexOf(value) > -1;
}

export default function RecursiveTreeElement(Element) {
    const openValues = new WeakMap();
    
    function addValue(value) {
        if (openValues.has(value)) {
            openValues.set(value, openValues.get(value) + 1);
            return;
        }
        
        openValues.set(value, 1);
    }
    
    function removeValue(value) {
        const n = openValues.get(value) - 1;
        
        if (!n) {
            openValues.delete(value);
            return;
        }
        
        openValues.set(value, n);
    }
    
    return function RecursiveElement(props) {
        const previousValue = useRef(null);
        const [state, setState] = useState(() => {
            const {deepOpen} = props;
            const open = shouldAutoFocus(props);
            
            return {
                deepOpen,
                open,
            };
        });
        
        useEffect(() => () => {
            const {value} = props;
            
            if (value && typeof value === 'object')
                removeValue(value);
        }, []);
        
        useEffect(() => {
            let {deepOpen, value} = props;
            let open = shouldAutoFocus(props);
            const wasValue = previousValue.current;
            
            if (wasValue !== value) {
                if (wasValue && typeof wasValue === 'object')
                    removeValue(wasValue);
                
                if (value && typeof value === 'object') {
                    if (openValues.has(value)) {
                        deepOpen = false;
                        open = false;
                    }
                    
                    addValue(value);
                }
                
                previousValue.current = value;
            }
            
            setState({
                deepOpen,
                open,
            });
        }, [props.value, props.focusPath, props.deepOpen]);
        
        return (
            <Element
                {...props}
                open={state.open}
                deepOpen={state.deepOpen}
            />
        );
    };
}
