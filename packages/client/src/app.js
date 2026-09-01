import '../css/style.css';
import {Provider, useSelector} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {createRoot} from 'react-dom/client';
import {ErrorBoundary} from 'react-error-boundary';
import * as LocalStorage from './snippet/LocalStorage.js';
import ASTOutput from './ast/ASTOutput.js';
import ConnectedEditor from './editor/ConnectedEditor.js';
import ErrorMessage from './ui/ErrorMessage.js';
import GistBanner from './snippet/GistBanner.js';
import LoadingIndicator from './ui/LoadingIndicator.js';
import PasteDropTarget from './ui/PasteDropTarget.js';
import SettingsDialog from './parser-selection/dialogs/SettingsDialog.js';
import ShareDialog from './snippet/dialogs/ShareDialog.js';
import SplitPane from './ui/SplitPane.js';
import Toolbar from './ui/Toolbar.js';
import Transformer from './transform/Transformer.js';
import debounce from './utils/debounce.ts';
import {
    putoutEditor,
    persist,
    revive,
} from './store/reducers.ts';
import {
    canSaveTransform,
    getRevision,
} from './store/selectors.ts';
import * as gist from './snippet/storage/gist.js';
import * as parse from './snippet/storage/parse';
import StorageHandler from './snippet/storage';
import {parserListener} from './parser-selection/store/parserMiddleware.ts';
import {formatListener} from './store/formatMiddleware.ts';
import {createSnippetListener} from './snippet/snippetMiddleware.ts';

function App() {
    const showTransformer = useSelector((s) => s.showTransformPanel);
    const hasError = useSelector((s) => Boolean(s.error));
    
    return (
        <div>
            <ErrorMessage/>
            <div className={'dropTarget' + (hasError ? ' hasError' : '')}>
                <PasteDropTarget>
                    <LoadingIndicator/>
                    <SettingsDialog/>
                    <ShareDialog/>
                    <div id="root">
                        <Toolbar/>
                        <GistBanner/>
                        <SplitPane
                            className="splitpane-content"
                            vertical={true}
                        >
                            <SplitPane
                                className="splitpane"
                            >
                                <ErrorBoundary
                                    fallbackRender={({error}) => (
                                        <div className="error-boundary">
                                            <p>{error.message}</p>
                                        </div>
                                    )}
                                >
                                    <ConnectedEditor/>
                                </ErrorBoundary>
                                <ErrorBoundary
                                    fallbackRender={({error}) => (
                                        <div className="error-boundary">
                                            <p>{error.message}</p>
                                        </div>
                                    )}
                                >
                                    <ASTOutput/>
                                </ErrorBoundary>
                            </SplitPane>
                            {showTransformer ? <Transformer/> : null}
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
    middleware: (getDefault) => getDefault({
        serializableCheck: false,
    })
        .prepend(parserListener.middleware)
        .prepend(snippetListener.middleware)
        .prepend(formatListener.middleware),
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
