import {
    useEffect,
    useState,
} from 'react';

/**
 * `(pointer: coarse)` — intent, not width.
 *
 * A narrow desktop window still has a keyboard and a tablet in a dock has a
 * pointer, so the query is the right question and `max-width` is the wrong one.
 * It is already the test `Input.tsx` uses to decide whether `Enter` sends, so
 * this is that same question asked once for the whole package rather than
 * re-derived per component.
 *
 * `false` where `matchMedia` is missing, which is the keyboard binding and the
 * safe default: a browser without the query still has a keyboard, and rendering
 * the full hint is the harmless direction.
 */
export const isCoarsePointer = (): boolean => typeof globalThis !== 'undefined' && typeof globalThis.matchMedia === 'function' && globalThis.matchMedia('(pointer: coarse)').matches;

/**
 * The same answer, but **kept up to date**.
 *
 * `isCoarsePointer` on its own is a mount-time read, which is right for a key
 * handler and wrong for layout: a surface that changes from mouse to touch
 * under a running page — a docked tablet, a convertible — would keep the hint
 * and the preview it no longer matches. So this subscribes to the query.
 *
 * The subscription is the whole cost of the hook and the reason it is a hook
 * rather than a function: `AstBlock` re-renders on the change, and the CSS
 * `@media (pointer: coarse)` block changes with it.
 */
export const useIsMobile = (): boolean => {
    const [coarse, setCoarse] = useState(isCoarsePointer);
    
    useEffect(() => {
        if (typeof globalThis.matchMedia !== 'function')
            return;
        
        const query = globalThis.matchMedia('(pointer: coarse)');
        
        const onChange = () => {
            setCoarse(query.matches);
        };
        
        onChange();
        query.addEventListener('change', onChange);
        
        return () => {
            query.removeEventListener('change', onChange);
        };
    }, []);
    
    return coarse;
};
