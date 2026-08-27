import {useSelector, useDispatch} from 'react-redux';
import ShareDialog from '../components/dialogs/ShareDialog.js';
import {closeShareDialog} from '../store/actions.js';
import {showShareDialog, getRevision} from '../store/selectors.js';

export default function ShareDialogContainer() {
    const visible = useSelector(showShareDialog);
    const snippet = useSelector(getRevision);
    const dispatch = useDispatch();
    return (
        <ShareDialog
            visible={visible}
            snippet={snippet}
            onWantToClose={() => dispatch(closeShareDialog())}
        />
    );
}
