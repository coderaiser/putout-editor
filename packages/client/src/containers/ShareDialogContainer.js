import {useSelector, useDispatch} from 'react-redux';
import ShareDialog from '../snippet/ShareDialog.js';
import {closeShareDialog} from '../store/reducers.ts';
import {
    showShareDialog,
    getRevision,
} from '../store/selectors.ts';

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
