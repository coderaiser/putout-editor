import {useState, useEffect} from 'react';

const MOBILE_BREAKPOINT = 768;

const isTouchDevice = () => {
    const {navigator, innerWidth} = globalThis;
    return navigator?.maxTouchPoints > 0 || innerWidth < MOBILE_BREAKPOINT;
};

export function useMobile() {
    const [isMobile, setIsMobile] = useState(() => isTouchDevice());
    
    useEffect(() => {
        const {matchMedia, navigator} = globalThis;
        const mediaQuery = matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        
        const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches || navigator?.maxTouchPoints > 0);
        
        mediaQuery.addEventListener('change', handleChange);
        
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);
    
    return isMobile;
}
