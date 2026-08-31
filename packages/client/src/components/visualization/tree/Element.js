import {useDispatch} from 'react-redux';
import {
    useEffect,
    useRef,
    useState,
} from 'react';
import cx from 'classnames';
import {TbAlertTriangle} from 'react-icons/tb';
import CompactArrayView from './CompactArrayView.js';
import CompactObjectView from './CompactObjectView.js';
import RecursiveTreeElement from './RecursiveTreeElement.js';
import stringify from '../../../utils/stringify.ts';
import {setHighlight, clearHighlight} from '../../../store/reducers.ts';

const isNumber = (a) => typeof a === 'number';
const isFn = (a) => typeof a === 'function';

let lastClickedElement = null;

function Element(props) {
    const {
        value,
        deepOpen,
        treeAdapter,
        focusPath,
        level,
    } = props;
    
    const dispatch = useDispatch();
    const container = useRef(null);
    const mounted = useRef(false);
    const previousFocusPath = useRef(null);
    const [, setRenderVersion] = useState(0);
    
    const selfHandle = useRef({
        trigger: () => setRenderVersion((version) => version + 1),
    });
    
    const [state, setState] = useState({
        open: props.open || !props.level || deepOpen || value && treeAdapter.opensByDefault(value, props.name),
        deepOpen,
        value,
        error: null,
    });
    
    const [previousProps, setPreviousProps] = useState(props);
    
    if (props !== previousProps) {
        setPreviousProps(props);
        setState((current) => ({
            ...current,
            open: props.open || props.deepOpen || current.open,
            deepOpen: props.deepOpen,
            value: props.value,
        }));
    }
    
    useEffect(() => () => {
        if (lastClickedElement === selfHandle.current)
            lastClickedElement = null;
    }, []);
    
    useEffect(() => {
        const wasFocusPath = previousFocusPath.current;
        const isInitialRender = !mounted.current;
        
        mounted.current = true;
        previousFocusPath.current = props.focusPath;
        
        if (isInitialRender) {
            if (props.settings.autofocus)
                scrollIntoView();
            
            return;
        }
        
        if (wasFocusPath !== props.focusPath && props.focusPath.indexOf(props.value) > -1 && props.settings.autofocus)
            scrollIntoView();
    });
    
    function scrollIntoView() {
        const {focusPath, value} = props;
        
        if (focusPath.length > 0 && focusPath.at(-1) === value)
            setTimeout(() => container.current?.scrollIntoView(), 0);
    }
    
    function toggleClick({shiftKey}) {
        const open = shiftKey || !state.open;
        
        const update = () => {
            // Make AST node accessible
            if (open)
                globalThis.$node = state.value;
            else
                delete globalThis.$node;
            
            setState((current) => ({
                ...current,
                open,
                deepOpen: shiftKey,
            }));
        };
        
        if (lastClickedElement && lastClickedElement !== selfHandle.current) {
            const element = lastClickedElement;
            
            lastClickedElement = open ? selfHandle.current : null;
            element.trigger();
            update();
            
            return;
        }
        
        lastClickedElement = open ? selfHandle.current : null;
        update();
    }
    
    function onMouseOver(e) {
        e.stopPropagation();
        
        dispatch(setHighlight(props.treeAdapter.getRange(state.value)));
    }
    
    function onMouseLeave() {
        dispatch(clearHighlight(props.treeAdapter.getRange(state.value)));
    }
    
    function execFunction() {
        const update = {
            error: null,
        };
        
        try {
            update.value = state.value.call(props.parent);
        } catch(err) {
            update.error = err;
        }
        
        setState((current) => ({
            ...current,
            ...update,
        }));
    }
    
    function createSubElement(key, value, name, computed) {
        return (
            <Element
                key={key}
                name={name}
                focusPath={props.focusPath}
                deepOpen={state.deepOpen}
                value={value}
                computed={computed}
                level={props.level + 1}
                treeAdapter={props.treeAdapter}
                settings={props.settings}
                parent={props.value}
            />
        );
    }
    
    function isFocused(level, path, value, open) {
        return level && path.indexOf(value) > -1
            && (!open || path.at(-1) === value);
    }
    
    const {open} = state;
    
    const focused = isFocused(level, focusPath, state.value, open);
    let valueOutput = null;
    let content = null;
    let prefix = null;
    let suffix = null;
    let showToggler = false;
    let enableHighlight = false;
    
    if (state.value && typeof state.value === 'object') {
        if (!Array.isArray(state.value)) {
            const nodeName = treeAdapter.getNodeName(state.value);
            
            if (nodeName)
                valueOutput = <span className="tokenName nc" onClick={toggleClick}>
                    {nodeName}{' '}
                    {lastClickedElement === selfHandle.current
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
            
            enableHighlight = treeAdapter.getRange(state.value) && level;
        } else {
            enableHighlight = true;
        }
        
        if (isNumber(state.value.length)) {
            if (state.value.length > 0 && open) {
                prefix = '[';
                suffix = ']';
                const elements = Array
                    .from(treeAdapter.walkNode(state.value))
                    .filter(({key}) => key !== 'length')
                    .map(({key, value, computed}) => createSubElement(
                        key,
                        value,
                        Number.isInteger(Number(key)) ? undefined : key,
                        computed,
                    ));
                
                content = <ul className="value-body">{elements}</ul>;
            } else {
                valueOutput = <span>
                    {valueOutput}
                    <CompactArrayView
                        array={state.value}
                        onClick={toggleClick}
                    />
                </span>;
            }
            
            showToggler = state.value.length > 0;
        } else {
            if (open) {
                prefix = '{';
                suffix = '}';
                const elements = Array
                    .from(treeAdapter.walkNode(state.value))
                    .map(({key, value, computed}) => createSubElement(key, value, key, computed));
                
                content = <ul className="value-body">{elements}</ul>;
                showToggler = elements.length > 0;
            } else {
                const keys = Array
                    .from(treeAdapter.walkNode(state.value))
                    .map(({key}) => key);
                
                valueOutput = <span>
                    {valueOutput}
                    <CompactObjectView
                        onClick={toggleClick}
                        keys={keys}
                    />
                </span>;
                showToggler = keys.length > 0;
            }
        }
    } else if (isFn(state.value)) {
        valueOutput = <span
            className="ge invokeable"
            title="Click to invoke function"
            onClick={execFunction}
        >
            (...)
        </span>;
        showToggler = false;
    } else {
        valueOutput = <span className="s">{stringify(state.value)}</span>;
        showToggler = false;
    }
    
    const name = props.name
        ? <span
            className="key"
            onClick={showToggler ? toggleClick : null}
        >
            <span className="name nb">
                {props.computed ? <span title="computed">*{props.name}</span> : props.name}
            </span>
            <span className="p">: </span>
        </span>
        : null;
    
    const classNames = cx({
        entry: true,
        focused,
        toggable: showToggler,
        open,
    });
    
    return (
        <li
            ref={container}
            className={classNames}
            onMouseOver={enableHighlight ? onMouseOver : null}
            onMouseLeave={enableHighlight ? onMouseLeave : null}
        >
            {name}
            <span className="value">
                {valueOutput}
            </span>
            {prefix
                ? <span className="prefix p">
                    {prefix}</span>
                : null}
            {content}
            {suffix ? <div className="suffix p">{suffix}</div> : null}
            {state.error
                ? <span>
                    {' '}
                    <TbAlertTriangle
                        title={state.error.message}
                    />
                </span>
                : null}
        </li>
    );
}

Element.displayName = 'Element';

export default RecursiveTreeElement(Element);
