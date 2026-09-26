import '../css/main.css';
import {Provider, useSelector} from 'react-redux';
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
import {createAppStore} from './app/createStore.ts';
import {installPersistence} from './app/persistence.ts';
import {installHandlers} from './app/handlers.ts';
import {type RootState} from './store/reducers.ts';

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
