import './css/chat.css';
import {Provider} from 'react-redux';
import {createRoot} from 'react-dom/client';
import {createAppStore} from './store/createStore.ts';
import App from './App.tsx';

const store = createAppStore();

const container = document.getElementById('container');
const root = createRoot(container!);

root.render(
    <Provider store={store}>
        <App/>
    </Provider>,
);
