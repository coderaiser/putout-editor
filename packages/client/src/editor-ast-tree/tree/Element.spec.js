import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
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
    
    return render(
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
    );
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
