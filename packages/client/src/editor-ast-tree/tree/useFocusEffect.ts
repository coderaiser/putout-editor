import {useEffect, useRef} from 'react';
import type {ElementProps, ElementState} from './types.ts';

export default function useFocusEffect(props: ElementProps, state: ElementState, setState: React.Dispatch<React.SetStateAction<ElementState>>, containerRef: React.RefObject<HTMLElement | null>) {
    const mounted = useRef(false);
    const previousFocusPath = useRef<unknown[] | null>(null);
    
    useEffect(() => {
        const wasFocusPath = previousFocusPath.current;
        const isInitialRender = !mounted.current;
        
        mounted.current = true;
        previousFocusPath.current = props.focusPath;
        
        if (isInitialRender) {
            if (props.settings.autofocus)
                scrollToLeaf(props.focusPath, props.value, containerRef);
            
            return;
        }
        
        if (wasFocusPath !== props.focusPath && props.focusPath.indexOf(props.value) > -1) {
            const isLeaf = props.focusPath.at(-1) === props.value;
            
            if (!isLeaf && !state.open)
                setState((current) => ({
                    ...current,
                    open: true,
                }));
            
            if (props.settings.autofocus)
                scrollToLeaf(props.focusPath, props.value, containerRef);
        }
    });
}

function scrollToLeaf(focusPath: unknown[], value: unknown, containerRef: React.RefObject<HTMLElement | null>) {
    if (focusPath.length > 0 && focusPath.at(-1) === value)
        setTimeout(() => containerRef.current?.scrollIntoView(), 0);
}
