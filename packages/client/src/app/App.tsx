import {useSelector} from 'react-redux';
import AstPanel from '#panel-ast';
import CodePanel from '#panel-code';
import SourcePanel from '#panel-source';
import TransformPanel from '#panel-transform';
import AppLayout from '#layout';
import {useMobile} from '#ui';
import MobileLayout from '#layout-mobile';
import ErrorMessage from '../ui/ErrorMessage.tsx';
import GistBanner from '../snippet/GistBanner.tsx';
import LoadingIndicator from '../ui/LoadingIndicator.tsx';
import PasteDropTarget from '../ui/PasteDropTarget.tsx';
import SettingsDialog from '../parser/dialogs/SettingsDialog.tsx';
import ShareDialog from '../snippet/dialogs/ShareDialog.tsx';
import Menu from '../menu/Menu.tsx';
import MobileMenu from '../menu/MobileMenu.tsx';
import {type RootState} from '../store/reducers.ts';

// Its own module so a spec can render the tree without the entry's side effects:
// importing app.tsx creates a store, subscribes persistence and calls createRoot.
export default function App() {
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
