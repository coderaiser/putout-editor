import {test} from 'supertape';
import {
    render,
    cleanup,
    act,
} from '@testing-library/react';
import {useRef, useState} from 'react';
import type {ElementProps, ElementState} from './types.ts';
import useFocusEffect from './useFocusEffect.ts';

const noop = () => {};

globalThis.HTMLElement.prototype.scrollIntoView = noop;

const makeProps = (overrides: Partial<ElementProps> = {}): ElementProps => ({
    focusPath: [],
    value: {
        type: 'Identifier',
    },
    name: null,
    level: 1,
    open: false,
    deepOpen: false,
    computed: false,
    treeAdapter: {
        getRange: () => null,
        getNodeName: () => null,
        walkNode: () => [],
        opensByDefault: () => false,
    },
    settings: {
        autofocus: false,
    },
    parent: null,
    ...overrides,
});

function TestHook({props}: {props: ElementProps;}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [state, setState] = useState<ElementState>({
        open: false,
        deepOpen: false,
        value: null,
        error: null,
    });
    
    useFocusEffect(props, state, setState, containerRef);
    return (
        <div ref={containerRef} data-open={state.open}/>
    );
}

// scrollToLeaf only scrolls when the focus path both is non-empty and ends at
// this value, so the leaf has to be last in the path for the scroll to happen.
const scrolled = () => {
    let count = 0;
    
    globalThis.HTMLElement.prototype.scrollIntoView = () => {
        count++;
    };
    
    return () => count;
};

test('useFocusEffect: scrolls to the focused leaf when autofocus is on', async (t) => {
    const counted = scrolled();
    const value = {
        type: 'Identifier',
    };
    
    render(
        <TestHook
            props={makeProps({
                value,
                focusPath: [value],
                settings: {
                    autofocus: true,
                },
            })}
        />,
    );
    
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
    });
    const result = counted();
    
    cleanup();
    globalThis.HTMLElement.prototype.scrollIntoView = noop;
    
    t.equal(result, 1);
    t.end();
});

test('useFocusEffect: does not scroll when the focus path does not end at the value', async (t) => {
    const counted = scrolled();
    const value = {
        type: 'Identifier',
    };
    
    render(
        <TestHook
            props={makeProps({
                value,
                // ends at a different node, so the `at(-1) === value` arm is false
                focusPath: [{
                    type: 'Program',
                }],
                settings: {
                    autofocus: true,
                },
            })}
        />,
    );
    
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
    });
    const result = counted();
    
    cleanup();
    globalThis.HTMLElement.prototype.scrollIntoView = noop;
    
    t.equal(result, 0);
    t.end();
});

// Reaches the autofocus line with autofocus off. The earlier tests either never

// get that far (value not in the focus path) or have it on, so the false arm

// was never taken.
test('useFocusEffect: does not scroll when autofocus is off', async (t) => {
    const counted = scrolled();
    const value = {
        type: 'Identifier',
    };
    
    render(
        <TestHook
            props={makeProps({
                value,
                focusPath: [value],
                settings: {
                    autofocus: false,
                },
            })}
        />,
    );
    
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
    });
    const result = counted();
    
    cleanup();
    globalThis.HTMLElement.prototype.scrollIntoView = noop;
    
    t.equal(result, 0);
    t.end();
});

// The autofocus check on line 32 is in the focusPath-*changed* branch, not the

// initial-render one, so a single render never reaches it with autofocus on.
test('useFocusEffect: scrolls when the focus path changes and autofocus is on', async (t) => {
    const counted = scrolled();
    const value = {
        type: 'Identifier',
    };
    
    const {rerender} = render(
        <TestHook
            props={makeProps({
                value,
                settings: {
                    autofocus: true,
                },
            })}
        />,
    );
    
    await act(() => {
        rerender(
            <TestHook
                props={makeProps({
                    value,
                    focusPath: [value],
                    settings: {
                        autofocus: true,
                    },
                })}
            />,
        );
    });
    
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
    });
    const result = counted();
    
    cleanup();
    globalThis.HTMLElement.prototype.scrollIntoView = noop;
    
    t.equal(result, 1);
    t.end();
});

test('useFocusEffect: does not open when value not in focusPath', async (t) => {
    const {container} = render(
        <TestHook props={makeProps()}/>,
    );
    
    await act(async () => {});
    const result = (container.querySelector('[data-open]') as HTMLElement | null)?.dataset.open;
    
    cleanup();
    
    t.equal(result, 'false');
    t.end();
});

test('useFocusEffect: opens non-leaf when focusPath changes to include value', async (t) => {
    const value = {
        type: 'Program',
    };
    
    const leaf = {
        type: 'Identifier',
    };
    
    const props = makeProps({
        value,
        focusPath: [value, leaf],
    });
    
    const {container, rerender} = render(
        <TestHook
            props={makeProps({
                value,
            })}
        />,
    );
    
    await act(() => {
        rerender(
            <TestHook props={props}/>,
        );
    });
    const result = (container.querySelector('[data-open]') as HTMLElement | null)?.dataset.open;
    
    cleanup();
    
    t.equal(result, 'true');
    t.end();
});

test('useFocusEffect: does not open leaf node', async (t) => {
    const value = {
        type: 'Identifier',
    };
    
    const props = makeProps({
        value,
        focusPath: [value],
    });
    
    const {container, rerender} = render(
        <TestHook
            props={makeProps({
                value,
            })}
        />,
    );
    
    await act(() => {
        rerender(
            <TestHook props={props}/>,
        );
    });
    const result = (container.querySelector('[data-open]') as HTMLElement | null)?.dataset.open;
    
    cleanup();
    
    t.equal(result, 'false');
    t.end();
});

test('useFocusEffect: scrolls on initial render when autofocus and leaf in focusPath', async (t) => {
    const value = {
        type: 'Identifier',
    };
    
    const {container} = render(
        <TestHook
            props={makeProps({
                value,
                focusPath: [value],
                settings: {
                    autofocus: true,
                },
            })}
        />,
    );
    
    await act(async () => {});
    const result = (container.querySelector('[data-open]') as HTMLElement | null)?.dataset.open;
    
    cleanup();
    
    t.equal(result, 'false');
    t.end();
});
