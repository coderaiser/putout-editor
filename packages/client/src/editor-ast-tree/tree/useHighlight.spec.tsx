import {test, stub} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {putoutEditor, type RootState} from '../../store/reducers.ts';
import useHighlight from './useHighlight.ts';
import {type TreeAdapter, type NodeRange} from './types.ts';

const makeAdapter = (range: NodeRange | null): TreeAdapter => ({
    getRange: () => range,
    getNodeName: () => null,
    walkNode: () => [],
    opensByDefault: () => false,
});

type TestComponentProps = {
    treeAdapter: TreeAdapter;
    value: unknown;
    onOver?: (event: React.MouseEvent) => void;
};

function TestComponent({treeAdapter, value, onOver}: TestComponentProps) {
    const {onMouseOver, onMouseLeave} = useHighlight(treeAdapter, value);
    
    return (
        <div
            id="target"
            onMouseOver={(event) => {
                onOver?.(event);
                onMouseOver(event);
            }}
            onMouseLeave={onMouseLeave}
        />
    );
}

type TestProps = {
    treeAdapter: TreeAdapter;
    value: unknown;
    onOver?: (event: React.MouseEvent) => void;
};

function renderWithStore(props: TestProps, store?: ReturnType<typeof configureStore>) {
    const currentStore = store || configureStore({
        reducer: putoutEditor,
    });
    
    render(
        <Provider store={currentStore}>
            <TestComponent {...props}/>
        </Provider>,
    );
    
    return currentStore;
}

test('useHighlight: onMouseOver sets highlightRange from adapter range', (t) => {
    const range: NodeRange = [0, 5];
    const store = renderWithStore({
        treeAdapter: makeAdapter(range),
        value: {},
    });
    
    fireEvent.mouseOver(document.querySelector('#target')!);
    cleanup();
    
    t.deepEqual((store.getState() as RootState).highlightRange, [0, 5]);
    t.end();
});

test('useHighlight: onMouseOver stops event propagation', (t) => {
    const stopPropagation = stub();
    
    renderWithStore({
        treeAdapter: makeAdapter([0, 5] as NodeRange),
        value: {},
    });
    
    const target = document.querySelector('#target')!;
    
    (target as HTMLElement).onmouseover = () => {
        stopPropagation();
    };
    
    fireEvent.mouseOver(target);
    cleanup();
    
    t.ok(stopPropagation.called);
    t.end();
});

test('useHighlight: onMouseLeave clears highlightRange', (t) => {
    const range: NodeRange = [0, 5];
    const store = configureStore({
        reducer: putoutEditor,
        preloadedState: {
            ...putoutEditor(undefined, {
                type: '@@INIT',
            }),
            highlightRange: range,
        },
    });
    
    renderWithStore({
        treeAdapter: makeAdapter(range),
        value: {},
    }, store);
    
    fireEvent.mouseLeave(document.querySelector('#target')!);
    cleanup();
    const {highlightRange} = store.getState() as RootState;
    
    t.notOk(highlightRange);
    t.end();
});

test('useHighlight: returns onMouseOver function', (t) => {
    let result: ReturnType<typeof useHighlight> | undefined;
    
    function ProbeComponent() {
        result = useHighlight(makeAdapter([0, 5] as NodeRange), {});
        
        return null;
    }
    
    render(
        <Provider
            store={configureStore({
                reducer: putoutEditor,
            })}
        >
            <ProbeComponent/>
        </Provider>,
    );
    cleanup();
    
    t.equal(typeof result!.onMouseOver, 'function');
    t.end();
});

test('useHighlight: returns onMouseLeave function', (t) => {
    let result: ReturnType<typeof useHighlight> | undefined;
    
    function ProbeComponent() {
        result = useHighlight(makeAdapter([0, 5] as NodeRange), {});
        
        return null;
    }
    
    render(
        <Provider
            store={configureStore({
                reducer: putoutEditor,
            })}
        >
            <ProbeComponent/>
        </Provider>,
    );
    cleanup();
    
    t.equal(typeof result!.onMouseLeave, 'function');
    t.end();
});

test('useHighlight: onMouseOver without range does not set highlightRange', (t) => {
    const store = renderWithStore({
        treeAdapter: makeAdapter(null),
        value: {},
    });
    
    fireEvent.mouseOver(document.querySelector('#target')!);
    cleanup();
    const {highlightRange} = store.getState() as RootState;
    
    t.notOk(highlightRange);
    t.end();
});

test('useHighlight: onMouseOver without range keeps existing highlightRange', (t) => {
    const store = configureStore({
        reducer: putoutEditor,
        preloadedState: {
            ...putoutEditor(undefined, {
                type: '@@INIT',
            }),
            highlightRange: [0, 5],
        },
    });
    
    renderWithStore({
        treeAdapter: makeAdapter(null),
        value: {},
    }, store);
    
    fireEvent.mouseOver(document.querySelector('#target')!);
    cleanup();
    
    t.deepEqual((store.getState() as RootState).highlightRange, [0, 5]);
    t.end();
});
