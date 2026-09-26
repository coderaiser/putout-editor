import '../css/main.css';
import {Provider} from 'react-redux';
import {createRoot} from 'react-dom/client';
import * as LocalStorage from './snippet/LocalStorage.ts';
import {createAppStore} from './app/createStore.ts';
import {installPersistence} from './app/persistence.ts';
import {installHandlers} from './app/handlers.ts';
import App from './app/App.tsx';

// The wiring below is covered by src/app/*.spec.ts. The three pieces used to be
// inline here, which left them untested and invisible to coverage: this file was
// the one module in src that no spec imported. Each piece takes what it needs as
// an argument, so a spec can drive it without a DOM or a real store.
const store = createAppStore(LocalStorage.readState());

installPersistence(store, (state) => {
    LocalStorage.writeState(state);
});

store.dispatch({
    type: 'INIT',
});

const container = document.getElementById('container');
const root = createRoot(container!);

root.render(
    <Provider store={store}>
        <App/>
    </Provider>,
);

installHandlers(store);
