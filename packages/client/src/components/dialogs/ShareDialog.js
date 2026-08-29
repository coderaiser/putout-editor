import PropTypes from 'prop-types';
import React from 'react';

export default class ShareDialog extends React.Component {
    constructor(props) {
        super(props);
        this._outerClick = this._outerClick.bind(this);
    }
    
    _outerClick(event) {
        if (event.target === document.getElementById('ShareDialog'))
            this.props.onWantToClose();
    }
    
    render() {
        if (this.props.visible) {
            const {
                versionedURL,
                latestURL,
                embedURL,
            } = this.props.snippet.getShareData();
            
            return (
                <div id="ShareDialog" className="dialog" onClick={this._outerClick}>
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
                                    {latestURL ? <dd>
                                        <input readOnly={true} onFocus={(e) => e.target.select()} value={latestURL}/>
                                    </dd> : null}
                                    {embedURL ? <dd>
                                        <input readOnly={true} onFocus={(e) => e.target.select()} value={embedURL}/>
                                    </dd> : null}
                                </dl>
                            </div>
                        </div>
                        <div className="footer">
                            <button onClick={this.props.onWantToClose}>Close</button>
                        </div>
                    </div>
                </div>
            );
        }
        
        return null;
    }
}

ShareDialog.propTypes = {
    onWantToClose: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired,
    snippet: PropTypes.object,
};
