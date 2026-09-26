import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import CodePanel from '#panel-code';
import {makeStore} from '#test/store';

test('CodePanel: renders without crashing', async (t) => {
    const {store} = makeStore();
    const {container} = render(
        <Provider store={store}>
            <CodePanel/>
        </Provider>,
    );
    
    await new Promise(setImmediate);
    
    const result = container.querySelector('.output');
    cleanup();
    
    t.ok(result);
    t.end();
});

test('CodePanel: falls back to default transformer when transformer unknown', async (t) => {
    const {store} = makeStore({
        workbench: {
            transform: {
                transformer: 'nope',
            },
        },
    });
    
    const {container} = render(
        <Provider store={store}>
            <CodePanel/>
        </Provider>,
    );
    
    await new Promise(setImmediate);
    
    const result = container.querySelector('.output');
    cleanup();
    
    t.ok(result);
    t.end();
});
