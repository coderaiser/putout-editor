import PropTypes from 'prop-types';
import PubSub from 'pubsub-js';
import React from 'react';
import {Provider, connect} from 'react-redux';
import {
    createStore,
    applyMiddleware,
    compose,
} from 'redux';
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
    astexplorer,
    persist,
    revive,
} from './store/reducers';
import {
    canSaveTransform,
    getRevision,
} from './store/selectors';
import {loadSnippet} from './store/actions';
import * as gist from './storage/gist';
import * as parse from './storage/parse';
import StorageHandler from './storage';
import '../css/style.css';
import parserMiddleware from './store/parserMiddleware';
import snippetMiddleware from './store/snippetMiddleware';

function resize() {
    PubSub.publish('PANEL_RESIZE');
}

function App(props) {
    return (
        <div>
            <ErrorMessageContainer/>
            <div className={'dropTarget' + (props.hasError ? ' hasError' : '')}>
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
                            {props.showTransformer ? <TransformerContainer/> : null}
                        </SplitPane>
                    </div>
                </PasteDropTargetContainer>
            </div>
        </div>
    );
}

App.propTypes = {
    hasError: PropTypes.bool,
    showTransformer: PropTypes.bool,
};

const AppContainer = connect((state) => ({
    showTransformer: state.showTransformPanel,
    hasError: Boolean(state.error),
}))(App);

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
    astexplorer,
    revive(LocalStorage.readState()),
    composeEnhancers(applyMiddleware(
        snippetMiddleware(new StorageHandler([gist, parse])),
        parserMiddleware,
    )),
);

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

root.render(<Provider store={store}>
    <AppContainer/>
</Provider>);

global.onhashchange = () => {
    store.dispatch(loadSnippet());
};

if (location.hash.length > 1)
    store.dispatch(loadSnippet());

global.onbeforeunload = () => {
    const state = store.getState();
    
    if (canSaveTransform(state))
        return 'You have unsaved transform code. Do you really want to leave?';
};
