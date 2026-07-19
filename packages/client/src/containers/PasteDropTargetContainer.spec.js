import {test} from 'supertape';
import {Provider} from 'react-redux';
import {render, cleanup} from '@testing-library/react';
import PasteDropTargetContainer, {
    mapDispatchToProps,
} from './PasteDropTargetContainer.js';

const noop = () => {};

function createStore(state) {
    const dispatched = [];
    
    return {
        getState: () => state,
        subscribe: () => noop,
        dispatch: (action) => {
            dispatched.push(action);
        },
        _getDispatched: () => dispatched,
    };
}

test('PasteDropTargetContainer: mapDispatchToProps onText dispatches dropText', (t) => {
    const dispatched = [];
    const dispatch = (action) => {
        dispatched.push(action);
    };
    
    const mdp = mapDispatchToProps(dispatch);
    
    mdp.onText('drop', {}, 'code', 'javascript');
    
    t.equal(dispatched.length, 1);
    t.end();
});

test('PasteDropTargetContainer: mapDispatchToProps onError dispatches setError', (t) => {
    const dispatched = [];
    const dispatch = (action) => {
        dispatched.push(action);
    };
    
    const mdp = mapDispatchToProps(dispatch);
    
    mdp.onError(Error('test'));
    
    t.equal(dispatched.length, 1);
    t.end();
});

test('PasteDropTargetContainer: renders child content', (t) => {
    const store = createStore({});
    
    render(
        <Provider store={store}>
            <PasteDropTargetContainer>
                <div id="child-test">hello</div>
            </PasteDropTargetContainer>
        </Provider>,
    );
    
    const child = document.querySelector('#child-test');
    
    cleanup();
    
    t.ok(child);
    t.end();
});
