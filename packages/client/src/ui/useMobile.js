import {useState, useEffect} from 'react';

const MOBILE_BREAKPOINT = 768;

export function useMobile() {
    const [isMobile, setIsMobile] = useState(() => globalThis.innerWidth < MOBILE_BREAKPOINT);
    
    useEffect(() => {
        const mediaQuery = globalThis.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        
        const handleChange = (event) => setIsMobile(event.matches);
        
        mediaQuery.addEventListener('change', handleChange);
        
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);
    
    return isMobile;
}
