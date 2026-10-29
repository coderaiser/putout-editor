import {useEffect, useState} from 'react';

/**
 * `(pointer: coarse)`: input type, not width. `false` when `matchMedia` is
 * missing: a keyboard is the safe default.
 */
export const isCoarsePointer = (): boolean => typeof globalThis !== 'undefined' && typeof globalThis.matchMedia === 'function' && globalThis.matchMedia('(pointer: coarse)').matches;

/**
 * The same answer, updated when the query changes (a docked tablet). Layout
 * needs updates; a key handler reads `isCoarsePointer` once.
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
