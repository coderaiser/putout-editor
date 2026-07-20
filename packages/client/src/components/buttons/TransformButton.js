import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import {getTransformerByID} from '../../parsers/index.js';

export default class TransformButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            forceClosed: false,
        };
        this._onClick = this._onClick.bind(this);
        this._onTriggerClick = this._onTriggerClick.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
    }
    
    _onClick({target}) {
        let transformID;
        
        if (target.nodeName.toLowerCase() === 'li')
            transformID = target.children[0].value;
        else
            transformID = target.value;
        
        this.props.onTransformChange(getTransformerByID(transformID));
        this.setState({
            forceClosed: true,
        });
    }
    
    _onTriggerClick() {
        if (this.props.transformer)
            this.props.onTransformChange(null);
        
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
                    'disabled': !this.props.category.transformers.length,
                    'is-closed': this.state.forceClosed,
                })}
                onMouseLeave={this._onMouseLeave}
            >
                <button
                    type="button"
                    onClick={this._onTriggerClick}
                    disabled={!this.props.category.transformers.length}
                >
                    <i
                        className={cx({
                            'fa': true,
                            'fa-lg': true,
                            'fa-toggle-off': !this.props.showTransformer,
                            'fa-toggle-on': this.props.showTransformer,
                            'fa-fw': true,
                        })}
                    />
                    Transform
                </button>
                {this.props.category.transformers.length && <ul>
                    {this.props.category.transformers.map((transformer) => (
                        <li
                            key={transformer.id}
                            className={cx({
                                selected: this.props.showTransformer && this.props.transformer === transformer,
                            })}
                            onClick={this._onClick}
                        >
                            <button value={transformer.id} type="button">
                                {transformer.displayName}
                            </button>
                        </li>
                    ))}
                </ul>}
            </div>
        );
    }
}

TransformButton.propTypes = {
    category: PropTypes.object,
    transformer: PropTypes.object,
    showTransformer: PropTypes.bool,
    onTransformChange: PropTypes.func,
};
