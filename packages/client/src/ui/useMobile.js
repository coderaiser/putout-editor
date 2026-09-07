import {useState, useEffect} from 'react';

const MOBILE_BREAKPOINT = 768;

const isTouchDevice = () =>
    globalThis.navigator?.maxTouchPoints > 0 ||
    globalThis.innerWidth < MOBILE_BREAKPOINT;

export function useMobile() {
    const [isMobile, setIsMobile] = useState(() => isTouchDevice());

    useEffect(() => {
        const mediaQuery = globalThis.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

        const handleChange = (event) => setIsMobile(
            event.matches || globalThis.navigator?.maxTouchPoints > 0,
        );

        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return isMobile;
}
