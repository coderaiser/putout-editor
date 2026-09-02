import {useEffect, useRef} from 'react';

export default function useFocusEffect(props, state, setState, containerRef) {
    const mounted = useRef(false);
    const previousFocusPath = useRef(null);

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

function scrollToLeaf(focusPath, value, containerRef) {
    if (focusPath.length > 0 && focusPath.at(-1) === value)
        setTimeout(() => containerRef.current?.scrollIntoView(), 0);
}