import PropTypes from 'prop-types';
import React from 'react';
import {TbCode, TbSettings} from 'react-icons/tb';
import {getParserByID} from '../../parsers/index.js';

export default class ParserButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            forceClosed: false,
        };
        this._onItemClick = this._onItemClick.bind(this);
        this._onTriggerClick = this._onTriggerClick.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
    }
    
    _onItemClick({currentTarget}) {
        const parserID = currentTarget.getAttribute('data-id');
        this.props.onParserChange(getParserByID(parserID));
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
        const parsers = this.props.category.parsers.filter((p) => p.showInMenu);
        const className = `button menuButton${this.state.forceClosed ? ' is-closed' : ''}`;
        
        return (
            <div
                className={className}
                ref={(c) => this._container = c}
                onMouseLeave={this._onMouseLeave}
            >
                <span onClick={this._onTriggerClick}>
                    <TbCode size={18}/>
                    {this.props.parser.displayName}
                </span>
                <ul>
                    {parsers.map((parser) => (
                        <li key={parser.id} onClick={this._onItemClick} data-id={parser.id}>
                            <button type="button">
                                {parser.displayName}
                            </button>
                        </li>
                    ))}
                </ul>
                <button
                    type="button"
                    title="Parser Settings"
                    style={{
                        minWidth: 0,
                    }}
                    disabled={!this.props.parser.hasSettings()}
                    onClick={this.props.onParserSettingsButtonClick}
                >
                    <TbSettings size={18}/>
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
