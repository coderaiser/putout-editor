import PropTypes from 'prop-types';
import React from 'react';
import {getParserByID} from '../../parsers/index.js';

export default class ParserButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
        };
        this._onClick = this._onClick.bind(this);
        this._toggleOpen = this._toggleOpen.bind(this);
        this._closeOnOutsideClick = this._closeOnOutsideClick.bind(this);
    }
    
    _onClick({currentTarget}) {
        const parserID = currentTarget.getAttribute('data-id');
        this.props.onParserChange(getParserByID(parserID));
        this.setState({
            open: false,
        });
    }
    
    _toggleOpen() {
        this.setState((prev) => ({
            open: !prev.open,
        }));
    }
    
    _closeOnOutsideClick(event) {
        if (!this._container || !this._container.contains(event.target))
            this.setState({
                open: false,
            });
    }
    
    componentDidMount() {
        globalThis.document.addEventListener('click', this._closeOnOutsideClick, true);
    }
    
    componentWillUnmount() {
        globalThis.document.removeEventListener('click', this._closeOnOutsideClick, true);
    }
    
    render() {
        const parsers = this.props.category.parsers.filter((p) => p.showInMenu);
        const className = `button menuButton${this.state.open ? ' is-open' : ''}`;
        
        return (
            <div
                className={className}
                ref={(c) => this._container = c}
            >
                <span onClick={this._toggleOpen}>
                    <i className="fa fa-lg fa-code fa-fw"/>
                    {this.props.parser.displayName}
                </span>
                {this.state.open && <ul>
                    {parsers.map((parser) => (
                        <li key={parser.id} onClick={this._onClick} data-id={parser.id}>
                            <button type="button">
                                {parser.displayName}
                            </button>
                        </li>
                    ))}
                </ul>}
                <button
                    type="button"
                    title="Parser Settings"
                    style={{
                        minWidth: 0,
                    }}
                    disabled={!this.props.parser.hasSettings()}
                    onClick={this.props.onParserSettingsButtonClick}
                >
                    <i className="fa fa-cog fa-fw"/>
                </button>
            </div>
        );
    }
}

ParserButton.propTypes = {
    onParserChange: PropTypes.func,
    onParserSettingsButtonClick: PropTypes.func,
    parser: PropTypes.object,
    category: PropTypes.object,
};
