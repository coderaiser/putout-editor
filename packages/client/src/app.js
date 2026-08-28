import '../css/style.css';
import PubSub from 'pubsub-js';
import {Provider, useSelector} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {createRoot} from 'react-dom/client';
import * as LocalStorage from './components/LocalStorage';
import ASTOutputContainer from './containers/ASTOutputContainer';
import CodeEditorContainer from './containers/CodeEditorContainer';
import ErrorMessageContainer from './containers/ErrorMessageContainer';
import GistBanner from './components/GistBanner';
import LoadingIndicatorContainer from './containers/LoadingIndicatorContainer';
import PasteDropTargetContainer from './containers/PasteDropTargetContainer';
import SettingsDialogContainer from './containers/SettingsDialogContainer';
import ShareDialogContainer from './containers/ShareDialogContainer';
import SplitPane from './components/SplitPane';
import ToolbarContainer from './containers/ToolbarContainer';
import TransformerContainer from './containers/TransformerContainer';
import debounce from './utils/debounce';
import {
    putoutEditor,
    persist,
    revive,
} from './store/reducers';
import {
    canSaveTransform,
    getRevision,
} from './store/selectors';
import * as gist from './storage/gist';
import * as parse from './storage/parse';
import StorageHandler from './storage';
import {parserListener} from './store/parserMiddleware';
import {createSnippetListener} from './store/snippetMiddleware';

function resize() {
    PubSub.publish('PANEL_RESIZE');
}

function App() {
    const showTransformer = useSelector((s) => s.showTransformPanel);
    const hasError = useSelector((s) => Boolean(s.error));
    
    return (
        <div>
            <ErrorMessageContainer/>
            <div className={'dropTarget' + (hasError ? ' hasError' : '')}>
                <PasteDropTargetContainer>
                    <LoadingIndicatorContainer/>
                    <SettingsDialogContainer/>
                    <ShareDialogContainer/>
                    <div id="root">
                        <ToolbarContainer/>
                        <GistBanner/>
                        <SplitPane
                            className="splitpane-content"
                            vertical={true}
                            onResize={resize}
                        >
                            <SplitPane
                                className="splitpane"
                                onResize={resize}
                            >
                                <CodeEditorContainer/>
                                <ASTOutputContainer/>
                            </SplitPane>
                            {showTransformer ? <TransformerContainer/> : null}
                        </SplitPane>
                    </div>
                </PasteDropTargetContainer>
            </div>
        </div>
    );
}

const storageAdapter = new StorageHandler([gist, parse]);
const snippetListener = createSnippetListener(storageAdapter);

const store = configureStore({
    reducer: putoutEditor,
    preloadedState: revive(LocalStorage.readState()),
    middleware: (getDefault) => getDefault()
        .prepend(parserListener.middleware)
        .prepend(snippetListener.middleware),
});

store.subscribe(debounce(() => {
    const state = store.getState();
    
    // We are not persisting the state while looking at an existing revision
    if (!getRevision(state))
        LocalStorage.writeState(persist(state));
}));
store.dispatch({
    type: 'INIT',
});

const container = document.getElementById('container');
const root = createRoot(container);

root.render(
    <Provider store={store}>
        <App/>
    </Provider>,
);

globalThis.onhashchange = () => {
    store.dispatch({
        type: 'snippet/load',
    });
};

if (location.hash.length > 1)
    store.dispatch({
        type: 'snippet/load',
    });

globalThis.onbeforeunload = () => {
    const state = store.getState();
    
    if (canSaveTransform(state))
        return 'You have unsaved transform code. Do you really want to leave?';
};
