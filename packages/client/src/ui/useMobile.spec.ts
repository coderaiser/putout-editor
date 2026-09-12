import {test} from 'supertape';
import {renderHook, act} from '@testing-library/react';
import {useMobile} from './useMobile.ts';

const noop = () => {};

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
    
    let handleChange!: (event: {matches: boolean}) => void;
    const originalMatchMedia = globalThis.matchMedia;
    
    function mockMatchMedia(query: string): MediaQueryList {
        return {
            matches: false,
            media: query,
            addEventListener: (_type: string, listener: any) => {
                handleChange = listener;
            },
            removeEventListener: noop,
        } as unknown as MediaQueryList;
    }
    
    globalThis.matchMedia = mockMatchMedia;
    
    const {result} = renderHook(() => useMobile());
    
    act(() => {
        handleChange({
            matches: true,
        });
    });
    
    globalThis.matchMedia = originalMatchMedia;
    
    t.ok(result.current);
    t.end();
});

test('useMobile: handleChange updates isMobile via maxTouchPoints when matches is false', (t) => {
    globalThis.innerWidth = 1024;
    
    let handleChange!: (event: {matches: boolean}) => void;
    const originalMatchMedia = globalThis.matchMedia;
    const originalMaxTouchPoints = globalThis.navigator?.maxTouchPoints;
    
    function mockMatchMedia(query: string): MediaQueryList {
        return {
            matches: false,
            media: query,
            addEventListener: (_type: string, listener: any) => {
                handleChange = listener;
            },
            removeEventListener: noop,
        } as unknown as MediaQueryList;
    }
    
    globalThis.matchMedia = mockMatchMedia;
    
    Object.defineProperty(globalThis.navigator, 'maxTouchPoints', {
        configurable: true,
        value: 2,
    });
    
    const {result} = renderHook(() => useMobile());
    
    act(() => {
        handleChange({
            matches: false,
        });
    });
    
    globalThis.matchMedia = originalMatchMedia;
    Object.defineProperty(globalThis.navigator, 'maxTouchPoints', {
        configurable: true,
        value: originalMaxTouchPoints,
    });
    
    t.ok(result.current);
    t.end();
});
