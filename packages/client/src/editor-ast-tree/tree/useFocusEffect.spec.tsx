import {test, stub} from 'supertape';
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
    treeAdapter: {} as never,
    settings: {
        autofocus: false,
    },
    parent: null,
    ...overrides,
});

function TestHook({props}: {props: ElementProps}) {
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

test('useFocusEffect: does not open when value not in focusPath', async (t) => {
    const {container} = render(
        <TestHook props={makeProps()}/>,
    );
    
    await act(stub().resolves());
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
    
    await act(stub().resolves());
    const result = (container.querySelector('[data-open]') as HTMLElement | null)?.dataset.open;
    
    cleanup();
    
    t.equal(result, 'false');
    t.end();
});
