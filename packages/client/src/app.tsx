import '../css/style.css';
import {Provider, useSelector} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {createRoot} from 'react-dom/client';
import AstPanel from '#panel-ast';
import CodePanel from '#panel-code';
import SourcePanel from '#panel-source';
import TransformPanel from '#panel-transform';
import AppLayout from '#layout';
import {useMobile} from '#ui';
import MobileLayout from '#layout-mobile';
import * as LocalStorage from './snippet/LocalStorage.ts';
import ErrorMessage from './ui/ErrorMessage.tsx';
import GistBanner from './snippet/GistBanner.tsx';
import LoadingIndicator from './ui/LoadingIndicator.tsx';
import PasteDropTarget from './ui/PasteDropTarget.tsx';
import SettingsDialog from './parser/dialogs/SettingsDialog.tsx';
import ShareDialog from './snippet/dialogs/ShareDialog.tsx';
import Menu from './menu/Menu.tsx';
import MobileMenu from './menu/MobileMenu.tsx';
import debounce from './app/debounce.ts';
import {
    putoutEditor,
    persist,
    revive,
    type RootState,
} from './store/reducers.ts';
import {
    canSaveTransform,
    getRevision,
} from './store/selectors.ts';
import * as gist from './snippet/storage/gist.ts';
import * as parse from './snippet/storage/parse.ts';
import StorageHandler from './snippet/storage/index.ts';
import {parserListener} from './parser/store/parserMiddleware.ts';
import {formatListener} from './store/formatMiddleware.ts';
import {createSnippetListener} from './snippet/snippetMiddleware.ts';

function App() {
    const hasError = useSelector((state: RootState) => Boolean(state.error));
    
    const isMobile = useMobile();
    const Layout = isMobile ? MobileLayout : AppLayout;
    
    return (
        <div>
            <ErrorMessage/>
            <div className={'dropTarget' + (hasError ? ' hasError' : '')}>
                <PasteDropTarget>
                    <LoadingIndicator/>
                    <SettingsDialog/>
                    <ShareDialog/>
                    <div id="root">
                        <Menu/>
                        <MobileMenu/>
                        <GistBanner/>
                        <Layout
                            topLeft={<SourcePanel/>}
                            topRight={<AstPanel/>}
                            bottomLeft={<TransformPanel/>}
                            bottomRight={<CodePanel/>}
                        />
                    </div>
                </PasteDropTarget>
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
const root = createRoot(container!);

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
