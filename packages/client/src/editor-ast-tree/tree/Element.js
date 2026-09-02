import {
    useEffect,
    useRef,
    useState,
} from 'react';
import cx from 'classnames';
import ElementName from './ElementName.js';
import ElementValue from './ElementValue.js';
import isFocused from './isFocused.js';
import RecursiveTreeElement from './RecursiveTreeElement.js';
import useElementState from './useElementState.js';
import useFocusEffect from './useFocusEffect.js';
import useHighlight from './useHighlight.js';

let lastClickedElement = null;

function Element(props) {
    const {
        treeAdapter,
        focusPath,
        level,
    } = props;
    
    const container = useRef(null);
    const [, setRenderVersion] = useState(0);
    
    const selfHandle = useRef({
        trigger: () => setRenderVersion((version) => version + 1),
    });
    
    const [state, setState] = useElementState(props, treeAdapter);

    useFocusEffect(props, state, setState, container);
    
    useEffect(() => () => {
        if (lastClickedElement === selfHandle.current)
            lastClickedElement = null;
    }, []);
    
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
    
    const {onMouseOver, onMouseLeave} = useHighlight(treeAdapter, state.value);

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
    
    const {open} = state;
    
    const focused = isFocused(level, focusPath, state.value, open);
    const value = state.value;
    const isObject = value && typeof value === 'object';
    const isArray = Array.isArray(value);
    const nodeName = isObject && !isArray ? treeAdapter.getNodeName(value) : null;
    const children = isObject ? Array.from(treeAdapter.walkNode(value)) : [];
    const enableHighlight = isObject && (isArray || treeAdapter.getRange(value) && level);
    const showToggler = !isObject
        ? false
        : typeof value.length === 'number'
            ? value.length > 0
            : children.length > 0;
    const showAsSelected = lastClickedElement === selfHandle.current;
    
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
            <ElementName
                name={props.name}
                computed={props.computed}
                showToggler={showToggler}
                onClick={toggleClick}
            />
            <ElementValue
                value={value}
                open={open}
                error={state.error}
                nodeName={nodeName}
                showAsSelected={showAsSelected}
                children={children}
                onClick={toggleClick}
                onExecFunction={execFunction}
                createSubElement={createSubElement}
            />
        </li>
    );
}

Element.displayName = 'Element';

export default RecursiveTreeElement(Element);
