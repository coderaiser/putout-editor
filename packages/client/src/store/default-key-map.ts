const MOBILE_BREAKPOINT = 768;

// Vim is a poor default on touch screens: the soft keyboard has no `Esc` and starts in normal mode.
// Same detection as `useMobile`, but it runs once, when the initial state is built.
export const getDefaultKeyMap = () => {
    const {navigator, innerWidth} = globalThis;
    const isMobile = navigator && navigator.maxTouchPoints > 0 || innerWidth < MOBILE_BREAKPOINT;
    
    return isMobile ? 'default' : 'vim';
};
