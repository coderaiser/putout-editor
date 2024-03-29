import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';

const keyMappings = [
    'default',
    'vim',
    'emacs',
    'sublime',
];

class KeyMapButton extends React.Component {
    render() {
        return (
            <div
                className={cx({
                    button: true,
                    menuButton: true,
                })}
            >
                <button
                    type="button"
                >
                    <i
                        className={cx({
                            'fa': true,
                            'fa-lg': true,
                            'fa-keyboard-o': true,
                        })}
                    />
                    {this.props.keyMap}
                </button>
                {<ul>
                    {keyMappings.map((keyMap) => <li
                        key={keyMap}
                        disabled={this.props.keyMap === keyMap}
                        onClick={() => this.props.onKeyMapChange(keyMap)}
                    >
                        <button type="button">
                            {keyMap}
                        </button>
                    </li>)}
                </ul>}
            </div>
        );
    }
}

KeyMapButton.propTypes = {
    onKeyMapChange: PropTypes.func,
    keyMap: PropTypes.string,
};

export default KeyMapButton;
