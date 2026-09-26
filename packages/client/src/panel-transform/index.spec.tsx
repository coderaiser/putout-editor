import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import TransformPanel from '#panel-transform';
import {makeStore} from '#test/store';

test('TransformPanel: renders null when showTransformPanel is false', (t) => {
    const {store} = makeStore({
        showTransformPanel: false,
    });
    
    const {container} = render(
        <Provider store={store}>
            <TransformPanel/>
        </Provider>,
    );
    
    cleanup();
    
    t.notOk(container.firstChild);
    t.end();
});

test('TransformPanel: renders EditorPlugin when showTransformPanel is true', (t) => {
    const {store} = makeStore({
        showTransformPanel: true,
    });
    
    const {container} = render(
        <Provider store={store}>
            <TransformPanel/>
        </Provider>,
    );
    
    const result = container.firstChild;
    
    cleanup();
    
    t.ok(result);
    t.end();
});
