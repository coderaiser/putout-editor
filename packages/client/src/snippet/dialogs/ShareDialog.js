import {useSelector, useDispatch} from 'react-redux';
import {closeShareDialog} from '../../store/reducers.ts';
import {
    showShareDialog,
    getRevision,
} from '../../store/selectors.ts';

export default function ShareDialog() {
    const visible = useSelector(showShareDialog);
    const snippet = useSelector(getRevision);
    const dispatch = useDispatch();
    
    const onWantToClose = () => dispatch(closeShareDialog());
    
    const onOuterClick = (event) => {
        if (event.target === document.getElementById('ShareDialog'))
            onWantToClose();
    };
    
    if (!visible)
        return null;
    
    const {
        versionedURL,
        latestURL,
        embedURL,
    } = snippet.getShareData();
    
    return (
        <div id="ShareDialog" className="dialog" onClick={onOuterClick}>
            <div
                className="inner"
                style={{
                    maxWidth: '80%',
                    width: 600,
                }}
            >
                <div className="body">
                    <div className="shareInfo">
                        <dl>
                            <dt>Current Revision</dt>
                            <dd>
                                <input readOnly={true} onFocus={(e) => e.target.select()} value={versionedURL}/>
                            </dd>
                            {latestURL
                                ? <dd>
                                    <input readOnly={true} onFocus={(e) => e.target.select()} value={latestURL}/>
                                </dd>
                                : null}
                            {embedURL
                                ? <dd>
                                    <input readOnly={true} onFocus={(e) => e.target.select()} value={embedURL}/>
                                </dd>
                                : null}
                        </dl>
                    </div>
                </div>
                <div className="footer">
                    <button onClick={onWantToClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
