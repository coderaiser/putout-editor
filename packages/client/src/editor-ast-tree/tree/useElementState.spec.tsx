import {test} from 'supertape';
import {
    render,
    cleanup,
    act,
} from '@testing-library/react';
import type {
    ElementProps,
    ElementState,
    TreeAdapter,
} from './types.ts';
import useElementState from './useElementState.ts';

const makeAdapter = (opensByDefault = false): TreeAdapter => ({
    getRange: () => null,
    getNodeName: () => null,
    walkNode: () => [],
    opensByDefault: () => opensByDefault,
});

const makeProps = (overrides: Partial<ElementProps> = {}): ElementProps => ({
    value: {
        type: 'Identifier',
    },
    deepOpen: false,
    focusPath: [],
    level: 1,
    open: false,
    name: null,
    computed: false,
    treeAdapter: makeAdapter(),
    settings: {
        autofocus: false,
    },
    parent: null,
    ...overrides,
});

type TestHookProps = {
    props: ElementProps;
    adapter: TreeAdapter;
    onState: (state: ElementState) => void;
};

function TestHook({props, adapter, onState}: TestHookProps) {
    const [state] = useElementState(props, adapter);
    onState(state);
    
    return null;
}

function captureState(props: ElementProps, adapter: TreeAdapter, onState: (state: ElementState) => void) {
    render(
        <TestHook props={props} adapter={adapter} onState={onState}/>,
    );
    cleanup();
}

test('useElementState: open is false by default at level 1', (t) => {
    let result: ElementState | undefined;
    
    captureState(makeProps(), makeAdapter(), (state) => {
        result = state;
    });
    
    t.notOk(result!.open);
    t.end();
});

test('useElementState: open is true at level 0', (t) => {
    let result: ElementState | undefined;
    
    captureState(makeProps({
        level: 0,
    }), makeAdapter(), (state) => {
        result = state;
    });
    
    t.ok(result!.open);
    t.end();
});

test('useElementState: open is true when value is in focusPath as non-leaf', (t) => {
    const value = {
        type: 'Program',
    };
    
    const leaf = {
        type: 'Identifier',
    };
    
    let result: ElementState | undefined;
    
    captureState(makeProps({
        value,
        focusPath: [value, leaf],
    }), makeAdapter(), (state) => {
        result = state;
    });
    
    t.ok(result!.open);
    t.end();
});

test('useElementState: open is false when value is leaf in focusPath', (t) => {
    const value = {
        type: 'Identifier',
    };
    
    let result: ElementState | undefined;
    
    captureState(makeProps({
        value,
        focusPath: [value],
    }), makeAdapter(), (state) => {
        result = state;
    });
    
    t.notOk(result!.open);
    t.end();
});

test('useElementState: initial value matches props.value', (t) => {
    const value = {
        type: 'Identifier',
    };
    
    let result: ElementState | undefined;
    
    captureState(makeProps({
        value,
    }), makeAdapter(), (state) => {
        result = state;
    });
    
    t.equal(result!.value, value);
    t.end();
});

test('useElementState: error is null initially', (t) => {
    let result: ElementState | undefined;
    
    captureState(makeProps(), makeAdapter(), (state) => {
        result = state;
    });
    
    t.notOk(result!.error);
    t.end();
});

test('useElementState: open is true when adapter opens by default', (t) => {
    let result: ElementState | undefined;
    
    captureState(makeProps(), makeAdapter(true), (state) => {
        result = state;
    });
    
    t.ok(result!.open);
    t.end();
});

test('useElementState: updates value when props change', async (t) => {
    const first = {
        type: 'Identifier',
    };
    
    const second = {
        type: 'Literal',
    };
    
    let result: ElementState | undefined;
    
    const {rerender} = render(
        <TestHook
            props={makeProps({
                value: first,
            })}
            adapter={makeAdapter()}
            onState={(state) => {
                result = state;
            }}
        />,
    );
    
    await act(() => {
        rerender(
            <TestHook
                props={makeProps({
                    value: second,
                })}
                adapter={makeAdapter()}
                onState={(state) => {
                    result = state;
                }}
            />,
        );
    });
    
    cleanup();
    
    t.equal(result!.value, second);
    t.end();
});
