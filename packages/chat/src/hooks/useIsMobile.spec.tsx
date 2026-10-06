import {test} from 'supertape';
import {
    render,
    cleanup,
    act,
} from '@testing-library/react';
import {
    isCoarsePointer,
    useIsMobile,
} from './useIsMobile.ts';

interface Pointer {
    coarse: boolean;
    listeners: Set<(event: MediaQueryListEvent) => void>;
}

// The deprecated `addListener`/`removeListener` pair is on `MediaQueryList` and
// happy-dom answers it; `noop` is the name the chat package already uses for it.
const noop = () => {};

/**
 * Install a `(pointer: coarse)` stub and run `fn` with it.
 *
 * Around the call rather than for the file: `useIsMobile` reads the query at
 * mount and subscribes immediately, so a stub left behind would silently change
 * every spec that ran after it. `listeners` is handed over because the specs
 * that assert a `change` event have no other way to fire one.
 */
const withPointer = (initial: boolean, fn: (pointer: Pointer) => void) => {
    const original = globalThis.matchMedia;
    
    const pointer: Pointer = {
        coarse: initial,
        listeners: new Set(),
    };
    
    globalThis.matchMedia = ((query: string) => ({
        // a **getter**, not a snapshot: the hook calls `matchMedia` once and then
        // re-reads `query.matches` inside its `change` listener, so a plain
        // property would be frozen at the value it had at subscribe time and the
        // listener could never observe a flip
        get matches() {
            return query === '(pointer: coarse)' && pointer.coarse;
        },
        media: query,
        addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
            pointer.listeners.add(listener);
        },
        removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
            pointer.listeners.delete(listener);
        },
        addListener: noop,
        removeListener: noop,
        dispatchEvent: () => true,
        onchange: null,
    })) as unknown as typeof globalThis.matchMedia;
    
    fn(pointer);
    
    globalThis.matchMedia = original;
};

/** Renders the hook and reports what it returned. */
const Hook = ({on}: {on: (mobile: boolean) => void}) => {
    on(useIsMobile());
    
    return null;
};

const read = (initial: boolean): boolean => {
    let result = initial;
    
    withPointer(initial, () => {
        render(
            <Hook
                on={(mobile) => {
                    result = mobile;
                }}
            />,
        );
    });
    
    cleanup();
    
    return result;
};

test('useIsMobile: isCoarsePointer is false without matchMedia', (t) => {
    const original = globalThis.matchMedia;
    
    Reflect.deleteProperty(globalThis, 'matchMedia');
    
    const result = isCoarsePointer();
    const expected = false;
    
    globalThis.matchMedia = original;
    
    t.equal(result, expected);
    t.end();
});

test('useIsMobile: isCoarsePointer is true for a coarse pointer', (t) => {
    let result = false;
    
    withPointer(true, () => {
        result = isCoarsePointer();
    });
    
    const expected = true;
    
    t.equal(result, expected);
    t.end();
});

test('useIsMobile: isCoarsePointer is false for a fine pointer', (t) => {
    let result = true;
    
    withPointer(false, () => {
        result = isCoarsePointer();
    });
    
    const expected = false;
    
    t.equal(result, expected);
    t.end();
});

/**
 * The mount-time read, with `matchMedia` absent.
 *
 * A separate case from the plain `isCoarsePointer` one because the hook has an
 * `early return` that the function does not: without `matchMedia` the effect
 * bails before subscribing, and that bail is a branch nothing else reaches.
 */
test('useIsMobile: returns false when matchMedia is absent', (t) => {
    const original = globalThis.matchMedia;
    
    Reflect.deleteProperty(globalThis, 'matchMedia');
    
    let result = true;
    
    render(
        <Hook
            on={(mobile) => {
                result = mobile;
            }}
        />,
    );
    
    cleanup();
    globalThis.matchMedia = original;
    
    const expected = false;
    
    t.equal(result, expected);
    t.end();
});

test('useIsMobile: returns true for a coarse pointer', (t) => {
    const result = read(true);
    const expected = true;
    
    t.equal(result, expected);
    t.end();
});

test('useIsMobile: returns false for a fine pointer', (t) => {
    const result = read(false);
    const expected = false;
    
    t.equal(result, expected);
    t.end();
});

/**
 * The reason this is a hook and not a function.
 *
 * A docked tablet or a convertible changes `(pointer: coarse)` under a running
 * page. A mount-time read keeps the old answer and the layout goes stale, so the
 * query's `change` event has to move the state. The stub's `coarse` flag is
 * flipped and every listener fired — the same shape `Input.spec.tsx` uses.
 */
test('useIsMobile: updates when the query fires a change event', (t) => {
    const values: boolean[] = [];
    const push = values.push.bind(values);
    
    withPointer(false, (pointer) => {
        render(
            <Hook
                on={push}
            />,
        );
        
        act(() => {
            pointer.coarse = true;
            
            for (const listener of pointer.listeners)
                listener({} as MediaQueryListEvent);
        });
    });
    
    const result = values;
    const expected = [
        false,
        true,
    ];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * And it stops listening on unmount.
 *
 * Without the teardown a `change` after unmount calls `setState` on a dead
 * component. This asserts the listener set is empty rather than that no error
 * was thrown, because nothing throws here — React swallows it.
 */
test('useIsMobile: unsubscribes on unmount', (t) => {
    let remaining = -1;
    
    withPointer(false, (pointer) => {
        const {unmount} = render(
            <Hook
                on={noop}
            />,
        );
        
        remaining = pointer.listeners.size;
        unmount();
        remaining = pointer.listeners.size;
    });
    
    const expected = 0;
    
    t.equal(remaining, expected);
    t.end();
});
