import {test} from 'supertape';
import {renderHook, act} from '@testing-library/react';
import {useMobile} from './useMobile.js';

test('useMobile: returns false when window is wider than breakpoint', (t) => {
    globalThis.innerWidth = 1024;
    const {result} = renderHook(() => useMobile());
    
    t.notOk(result.current);
    t.end();
});

test('useMobile: returns true when window is narrower than breakpoint', (t) => {
    globalThis.innerWidth = 375;
    const {result} = renderHook(() => useMobile());

    t.ok(result.current);
    t.end();
});

test('useMobile: handleChange updates isMobile when media query matches', (t) => {
    globalThis.innerWidth = 1024;

    let handleChange;
    const originalMatchMedia = globalThis.matchMedia;

    globalThis.matchMedia = (query) => ({
        matches: false,
        media: query,
        addEventListener: (type, listener) => {
            handleChange = listener;
        },
        removeEventListener: () => {},
    });

    const {result} = renderHook(() => useMobile());

    act(() => {
        handleChange({matches: true});
    });

    t.ok(result.current);

    globalThis.matchMedia = originalMatchMedia;

    t.end();
});
