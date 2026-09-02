import {test} from 'supertape';
import {
    render,
    cleanup,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import Element from './Element.js';
import {treeAdapterFromParseResult} from '../TreeAdapter.js';
import {putoutEditor} from '../../store/reducers.ts';

globalThis.HTMLElement.prototype.scrollIntoView = () => {};

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