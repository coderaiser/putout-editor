import PropTypes from 'prop-types';
import {TbAlertTriangle} from 'react-icons/tb';
import CompactArrayView from './CompactArrayView.js';
import CompactObjectView from './CompactObjectView.js';
import stringify from '../../editor/stringify.ts';

const isNumber = (value) => typeof value === 'number';

function renderError(error) {
    return (
        <span>
            {' '}
            <TbAlertTriangle title={error.message}/>
        </span>
    );
}

export default function ElementValue({
    value,
    open,
    error,
    nodeName,
    showAsSelected,
    children,
    onClick,
    onExecFunction,
    createSubElement,
}) {
    let valueOutput = null;
    let content = null;
    let prefix = null;
    let suffix = null;

    if (nodeName)
        valueOutput = <span className="tokenName nc" onClick={onClick}>
            {nodeName}{' '}
            {showAsSelected
                ? <span
                    className="ge"
                    style={{
                        fontSize: '0.8em',
                    }}
                >
                    {' = $node'}
                </span>
                : null}
        </span>;

    if (value && typeof value === 'object') {
        if (isNumber(value.length)) {
            if (value.length > 0 && open) {
                prefix = '[';
                suffix = ']';
                const elements = children
                    .filter(({key}) => key !== 'length')
                    .map(({key, value: childValue, computed}) => createSubElement(
                        key,
                        childValue,
                        Number.isInteger(Number(key)) ? undefined : key,
                        computed,
                    ));

                content = <ul className="value-body">{elements}</ul>;
            } else {
                valueOutput = <span>
                    {valueOutput}
                    <CompactArrayView
                        array={value}
                        onClick={onClick}
                    />
                </span>;
            }
        } else {
            if (open) {
                prefix = '{';
                suffix = '}';
                const elements = children.map(({key, value: childValue, computed}) => createSubElement(key, childValue, key, computed));

                content = <ul className="value-body">{elements}</ul>;
            } else {
                const keys = children.map(({key}) => key);

                valueOutput = <span>
                    {valueOutput}
                    <CompactObjectView
                        onClick={onClick}
                        keys={keys}
                    />
                </span>;
            }
        }
    } else if (typeof value === 'function') {
        valueOutput = <span
            className="ge invokeable"
            title="Click to invoke function"
            onClick={onExecFunction}
        >
            (...)
        </span>;
    } else {
        valueOutput = <span className="s">{stringify(value)}</span>;
    }

    return (
        <>
            <span className="value">
                {valueOutput}
            </span>
            {prefix
                ? <span className="prefix p">
                    {prefix}</span>
                : null}
            {content}
            {suffix ? <div className="suffix p">{suffix}</div> : null}
            {error ? renderError(error) : null}
        </>
    );
}

ElementValue.propTypes = {
    value: PropTypes.any,
    open: PropTypes.bool,
    error: PropTypes.object,
    nodeName: PropTypes.string,
    showAsSelected: PropTypes.bool,
    children: PropTypes.array,
    onClick: PropTypes.func,
    onExecFunction: PropTypes.func,
    createSubElement: PropTypes.func,
};