import {test, stub} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {putoutEditor} from '../../store/reducers.ts';
import useHighlight from './useHighlight.js';

const makeAdapter = (range) => ({
    getRange: () => range,
});

function TestComponent({treeAdapter, value, onOver}) {
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

function renderWithStore(props, store) {
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
    const range = [0, 5];
    const store = renderWithStore({
        treeAdapter: makeAdapter(range),
        value: {},
    });
    
    fireEvent.mouseOver(document.querySelector('#target'));
    cleanup();
    
    t.deepEqual(store.getState().highlightRange, [0, 5]);
    t.end();
});

test('useHighlight: onMouseOver stops event propagation', (t) => {
    const stopPropagation = stub();
    
    renderWithStore({
        treeAdapter: makeAdapter([0, 5]),
        value: {},
    });
    
    const target = document.querySelector('#target');
    
    target.onmouseover = () => {
        stopPropagation();
    };
    
    fireEvent.mouseOver(target);
    cleanup();
    
    t.ok(stopPropagation.called);
    t.end();
});

test('useHighlight: onMouseLeave clears highlightRange', (t) => {
    const range = [0, 5];
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
    
    fireEvent.mouseLeave(document.querySelector('#target'));
    cleanup();
    const {highlightRange} = store.getState();
    
    t.notOk(highlightRange);
    t.end();
});

test('useHighlight: returns onMouseOver function', (t) => {
    let result;
    
    function ProbeComponent() {
        result = useHighlight(makeAdapter([0, 5]), {});
        
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
    
    t.equal(typeof result.onMouseOver, 'function');
    t.end();
});

test('useHighlight: returns onMouseLeave function', (t) => {
    let result;
    
    function ProbeComponent() {
        result = useHighlight(makeAdapter([0, 5]), {});
        
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
    
    t.equal(typeof result.onMouseLeave, 'function');
    t.end();
});
