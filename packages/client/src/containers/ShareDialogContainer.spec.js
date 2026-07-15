import {test} from 'supertape';
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import {render, cleanup} from '@testing-library/react';
import {
    OPEN_SHARE_DIALOG,
    CLOSE_SHARE_DIALOG,
} from '../store/actions.js';
import ShareDialogContainer from './ShareDialogContainer.js';

function reducer(state = {
    showShareDialog: false,
    activeRevision: null,
}, action) {
    switch(action.type) {
    case OPEN_SHARE_DIALOG:
        return {
            ...state,
            showShareDialog: true,
            activeRevision: {
                getShareInfo: () => 'share info',
            },
        };
    
    case CLOSE_SHARE_DIALOG:
        return {
            ...state,
            showShareDialog: false,
        };
    
    default:
        return state;
    }
}

test('ShareDialogContainer: not visible by default', (t) => {
    const store = createStore(reducer);
    
    render(<Provider store={store}>
        <ShareDialogContainer/>
    </Provider>);
    
    const dialog = document.getElementById('ShareDialog');
    
    cleanup();
    
    t.notOk(dialog);
    t.end();
});

test('ShareDialogContainer: visible after OPEN_SHARE_DIALOG', (t) => {
    const store = createStore(reducer);
    
    store.dispatch({
        type: OPEN_SHARE_DIALOG,
    });
    
    render(<Provider store={store}>
        <ShareDialogContainer/>
    </Provider>);
    
    const dialog = document.getElementById('ShareDialog');
    
    cleanup();
    
    t.ok(dialog);
    t.end();
});
