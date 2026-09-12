import {TbAlertTriangle} from 'react-icons/tb';
import CompactArrayView from './CompactArrayView.tsx';
import CompactObjectView from './CompactObjectView.tsx';
import stringify from '../../editor/stringify.ts';
import type {TreeAdapterChild} from './types.ts';

const isFn = (a: unknown): a is Function => typeof a === 'function';

const isNumber = (value: unknown): value is number => typeof value === 'number';

type ElementValueProps = {
    value: unknown;
    open: boolean;
    error: Error | null;
    nodeName: string | null;
    showAsSelected: boolean;
    children: TreeAdapterChild[];
    onClick: () => void;
    onExecFunction: () => void;
    createSubElement: (key: string, value: unknown, name: string | null | undefined, computed: boolean) => React.ReactNode;
};

function renderError(error: Error) {
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
}: ElementValueProps) {
    let valueOutput: React.ReactNode = null;
    let content: React.ReactNode = null;
    let prefix: string | null = null;
    let suffix: string | null = null;
    
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
        const item = value as {
            length?: unknown;
        };
        
        if (isNumber(item.length)) {
            if (item.length > 0 && open) {
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
                        array={value as unknown[]}
                        onClick={onClick}
                    />
                </span>;
            }
        } else if (open) {
            prefix = '{';
            suffix = '}';
            const elements = [];
            
            for (const {key, value: childValue, computed} of children) {
                elements.push(createSubElement(key, childValue, key, computed));
            }
            
            content = <ul className="value-body">{elements}</ul>;
        } else {
            const keys: string[] = [];
            
            for (const {key} of children) {
                keys.push(key);
            }
            
            valueOutput = <span>
                {valueOutput}
                <CompactObjectView
                    onClick={onClick}
                    keys={keys}
                />
            </span>;
        }
    } else if (isFn(value))
        valueOutput = <span
            className="ge invokeable"
            title="Click to invoke function"
            onClick={onExecFunction}
        >
            (...)
        </span>;
    else
        valueOutput = <span className="s">{stringify(value)}</span>;
    
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
