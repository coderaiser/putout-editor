import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import {TbDeviceFloppy, TbFileCode, TbGitFork, TbLoader2} from 'react-icons/tb';
import ForkButton from './ForkButton.js';
import NewButton from './NewButton.js';
import SaveButton from './SaveButton.js';
import ShareButton from './ShareButton.js';

export default class SnippetButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            forceClosed: false,
        };
        this._onTriggerClick = this._onTriggerClick.bind(this);
        this._onItemClick = this._onItemClick.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
    }
    
    _onTriggerClick() {
        this.setState({
            forceClosed: true,
        });
    }
    
    _onItemClick() {
        this.setState({
            forceClosed: true,
        });
    }
    
    _onMouseLeave() {
        this.setState({
            forceClosed: false,
        });
    }
    
    render() {
        const {props} = this;
        const canForkAndNotSave = props.canFork && !props.canSave;
        const savingOrForking = props.saving || props.forking;
        
        return (
            <div
                className={cx({
                    'button': true,
                    'menuButton': true,
                    'is-closed': this.state.forceClosed,
                })}
                onMouseLeave={this._onMouseLeave}
            >
                <span onClick={this._onTriggerClick}>
                    <TbFileCode size={18}/>
                    Snippet
                </span>
                <ul onClick={this._onItemClick}>
                    <li><NewButton {...props}/></li>
                    <li><SaveButton {...props}/></li>
                    <li><ForkButton {...props}/></li>
                    <li><ShareButton {...props}/></li>
                </ul>
                <button
                    type="button"
                    title={canForkAndNotSave ? 'Fork' : 'Save'}
                    style={{
                        minWidth: 0,
                    }}
                    disabled={savingOrForking || !props.canSave && !props.canFork}
                    onClick={canForkAndNotSave ? props.onFork : props.onSave}
                >
                    {savingOrForking
                        ? <TbLoader2 size={18}/>
                        : canForkAndNotSave
                            ? <TbGitFork size={18}/>
                            : <TbDeviceFloppy size={18}/>}
                </button>
            </div>
        );
    }
}

SnippetButton.propTypes = {
    canFork: PropTypes.bool,
    canSave: PropTypes.bool,
    forking: PropTypes.bool,
    onFork: PropTypes.func,
    onSave: PropTypes.func,
    saving: PropTypes.bool,
};
