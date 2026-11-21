import {
    useLayoutEffect,
    useReducer,
    useRef,
} from 'react';
import {keyToAction} from './treeKeys.ts';
import {
    visibleOf,
    type Focus,
    type TreeNode,
    type TreeState,
} from './treeModel.ts';
import {
    createTreeState,
    treeReducer,
    type TreeAction,
} from './treeReducer.ts';

export interface TreeOptions<T extends TreeNode> {
    /** What a query is matched against — an AST row's type and detail, a learn row's label and summary. */
    textOf: (node: T) => string;
    
    /**
     * Depth from which rows start collapsed. `1` is the AST tree's: the root is
     * open and everything under a first-level node is folded, so `/ast` draws two
     * rows. `/learn` passes `0` — the root is open and its sections are not,
     * because a concept tree's first level *is* the table of contents.
     */
    collapsedDepth?: number;
    
    /**
     * Enter/space on a row with no children. Omitted, every row toggles, which
     * is the AST tree: there is nothing to open, so the caret is the answer.
     */
    onOpen?: (node: T) => void;
}

/**
 * The state of one tree and the keys that drive it. The model is in
 * `treeModel`, the key table in `treeKeys`, the transitions in `treeReducer`.
 * This file only joins them to React and to the DOM.
 */
export const useTreeState = <T extends TreeNode>(nodes: T[], options: TreeOptions<T>) => {
    const {
        textOf,
        collapsedDepth = 1,
        onOpen,
    } = options;
    
    const reduce = (previous: TreeState, action: TreeAction<T>) => treeReducer(previous, action);
    const [state, dispatch] = useReducer(reduce, nodes, (initial) => createTreeState(initial, collapsedDepth));
    
    const handle = (event: KeyboardEvent) => {
        const {
            action,
            open,
            prevent,
            focusRoot,
        } = keyToAction(event.key, {
            ...state,
            nodes,
            textOf,
            canOpen: Boolean(onOpen),
        });
        
        if (prevent)
            event.preventDefault();
        
        if (action)
            dispatch(action);
        
        if (open)
            onOpen!(open);
        
        // `currentTarget` is the root this listener is bound to: the focus goes
        // to this tree, never to a second tree on the same page.
        if (focusRoot)
            (event.currentTarget as HTMLElement).focus();
    };
    
    /**
     * The listener never changes identity, so it is attached once and removed
     * once. `latest` holds the closure of the last commit, which is the one that
     * sees the current state. A layout effect writes it: a ref is not written
     * in render, and the effect runs before the browser can send the next key.
     */
    const latest = useRef(handle);
    
    useLayoutEffect(() => {
        latest.current = handle;
    });
    
    const onKeyDown = (event: KeyboardEvent) => latest.current(event);
    
    /**
     * A ref callback that returns a cleanup. The listener is on the root div, not
     * on `document`, so two trees on one page — the chat message and the console
     * panel — each answer only their own keys.
     */
    const root = (element: HTMLDivElement) => {
        element.addEventListener('keydown', onKeyDown);
        
        return () => element.removeEventListener('keydown', onKeyDown);
    };
    
    /**
     * A query searches the whole tree, not the folded view: the default fold hides
     * everything below depth 1, and a search that skipped it would find nothing.
     * Clearing the query brings the folds back.
     */
    const visible = visibleOf(nodes, state.collapsed, state.query, textOf);
    
    const toggle = (id: string) => dispatch({
        kind: 'toggle',
        id,
    });
    
    const select = (id: string) => dispatch({
        kind: 'select',
        id,
    });
    
    const setQuery = (query: string) => dispatch({
        kind: 'query',
        query,
    });
    
    const setFocus = (focus: Focus) => dispatch({
        kind: 'focus',
        focus,
    });
    
    return {
        ...state,
        root,
        visible,
        toggle,
        select,
        setQuery,
        setFocus,
    };
};
