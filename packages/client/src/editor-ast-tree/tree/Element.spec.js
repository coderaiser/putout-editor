import {test} from 'supertape';
import {render, cleanup, act} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import Element from './Element.js';
import {treeAdapterFromParseResult} from '../../parser/TreeAdapter.js';
import {putoutEditor} from '../../store/reducers.ts';

const noop = () => {};

globalThis.HTMLElement.prototype.scrollIntoView = noop;

const settings = {
    autofocus: true,
    hideFunctions: true,
    hideEmptyKeys: false,
    hideLocationData: false,
    hideTypeKeys: false,
};

const treeAdapter = treeAdapterFromParseResult({
    treeAdapter: {
        type: 'estree',
        options: {},
    },
}, settings);

function renderElement(props) {
    const store = configureStore({
        reducer: putoutEditor,
        middleware: (getDefault) => getDefault({
            serializableCheck: false,
        }),
    });
    
    return {
        store,
        ...render(
            <Provider store={store}>
                <ul>
                    <Element
                        treeAdapter={treeAdapter}
                        settings={settings}
                        focusPath={[]}
                        level={1}
                        {...props}
                    />
                </ul>
            </Provider>,
        ),
    };
}

test('Element: renders Identifier node name correctly', (t) => {
    const identifierNode = {
        type: 'Identifier',
        name: 'a',
        start: 4,
        end: 5,
    };
    
    const {container} = renderElement({
        value: identifierNode,
        open: true,
    });
    
    const tokenName = container.querySelector('.tokenName');
    const result = tokenName ? tokenName.textContent.trim() : null;
    
    cleanup();
    
    t.equal(result, 'Identifier', 'should show Identifier, not VariableDeclarator');
    t.end();
});

test('Element: Identifier is focused on first render when cursor is inside it', (t) => {
    const identifier = {
        type: 'Identifier',
        name: 'a',
        start: 6,
        end: 7,
    };
    
    const declarator = {
        type: 'VariableDeclarator',
        id: identifier,
        init: {
            type: 'NumericLiteral',
            value: 3,
            start: 10,
            end: 11,
        },
        start: 6,
        end: 11,
    };
    
    const declaration = {
        type: 'VariableDeclaration',
        kind: 'const',
        declarations: [declarator],
        start: 0,
        end: 12,
    };
    
    const focusPath = [declaration, declarator, identifier];
    
    const {container} = renderElement({
        value: declaration,
        focusPath,
        level: 1,
    });
    
    // No setTimeout — must be immediate on first render
    const focused = container.querySelector('.focused');
    const focusedText = focused?.querySelector('.tokenName')?.textContent?.trim() || '';
    
    cleanup();
    
    t.equal(focusedText, 'Identifier');
    t.end();
});

test('Element: dispatches setCursor when clicking on a node with range', (t) => {
    const identifierNode = {
        type: 'Identifier',
        name: 'a',
        start: 4,
        end: 5,
    };
    
    const {store, container} = renderElement({
        value: identifierNode,
        name: 'a',
    });
    
    const keyElement = container.querySelector('.key');
    
    act(() => {
        keyElement.click();
    });
    
    const cursor = store.getState().cursor;
    
    cleanup();
    
    t.equal(cursor, 4, 'should dispatch setCursor with start position');
    t.end();
});

test('Element: dispatches setHighlight when clicking on a node with range', (t) => {
    const identifierNode = {
        type: 'Identifier',
        name: 'a',
        start: 4,
        end: 5,
    };
    
    const {store, container} = renderElement({
        value: identifierNode,
        name: 'a',
    });
    
    const keyElement = container.querySelector('.key');
    
    act(() => {
        keyElement.click();
    });
    
    const highlightRange = store.getState().highlightRange;
    
    cleanup();
    
    t.deepEqual(highlightRange, [4, 5], 'should dispatch setHighlight with range');
    t.end();
});

test('Element: does not dispatch setCursor when clicking on a node without range', (t) => {
    const identifierNode = {
        type: 'Identifier',
        name: 'a',
    };
    
    const {store, container} = renderElement({
        value: identifierNode,
        name: 'a',
    });
    
    const keyElement = container.querySelector('.key');
    
    act(() => {
        keyElement.click();
    });
    
    const cursor = store.getState().cursor;
    
    cleanup();
    
    t.equal(cursor, null, 'should not dispatch setCursor');
    t.end();
});

test('Element: does not dispatch setHighlight when clicking on a node without range', (t) => {
    const identifierNode = {
        type: 'Identifier',
        name: 'a',
    };
    
    const {store, container} = renderElement({
        value: identifierNode,
        name: 'a',
    });
    
    const keyElement = container.querySelector('.key');
    
    act(() => {
        keyElement.click();
    });
    
    const highlightRange = store.getState().highlightRange;
    
    cleanup();
    
    t.equal(highlightRange, null, 'should not dispatch setHighlight');
    t.end();
});