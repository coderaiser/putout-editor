import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import {TbKeyboard} from 'react-icons/tb';

const keyMappings = [
    'default',
    'vim',
    'emacs',
];

class KeyMapButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            forceClosed: false,
        };
        this._onItemClick = this._onItemClick.bind(this);
        this._onTriggerClick = this._onTriggerClick.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
    }
    
    _onItemClick(keyMap) {
        this.props.onKeyMapChange(keyMap);
        this.setState({
            forceClosed: true,
        });
    }
    
    _onTriggerClick() {
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
        return (
            <div
                className={cx({
                    'button': true,
                    'menuButton': true,
                    'is-closed': this.state.forceClosed,
                })}
                onMouseLeave={this._onMouseLeave}
            >
                <button
                    type="button"
                    onClick={this._onTriggerClick}
                >
                    <TbKeyboard size={18}/>
                    {this.props.keyMap}
                </button>
                <ul>
                    {keyMappings.map((keyMap) => (
                        <li
                            key={keyMap}
                            disabled={this.props.keyMap === keyMap}
                            onClick={() => this._onItemClick(keyMap)}
                        >
                            <button type="button">
                                {keyMap}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}

KeyMapButton.propTypes = {
    onKeyMapChange: PropTypes.func,
    keyMap: PropTypes.string,
};

export default KeyMapButton;
