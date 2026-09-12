import {
    useEffect,
    useRef,
    useState,
} from 'react';
import type {ComponentType} from 'react';
import type {ElementSettings} from './types.ts';

type AutoFocusProps = {
    value: unknown;
    settings: ElementSettings;
    focusPath: unknown[];
};

function shouldAutoFocus({value, settings, focusPath}: AutoFocusProps) {
    return settings.autofocus && focusPath.indexOf(value) > -1;
}

export default function RecursiveTreeElement(Element: ComponentType<any>) {
    const openValues = new WeakMap<object, number>();
    
    function addValue(value: object) {
        if (openValues.has(value)) {
            openValues.set(value, openValues.get(value)! + 1);
            return;
        }
        
        openValues.set(value, 1);
    }
    
    function removeValue(value: object) {
        const n = openValues.get(value)! - 1;
        
        if (!n) {
            openValues.delete(value);
            return;
        }
        
        openValues.set(value, n);
    }
    
    return function RecursiveElement(props: any) {
        const previousValue = useRef<unknown>(null);
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
