import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    defaultCollapsed,
    expandMove,
    filterNodes,
    foldMove,
    hasChildren,
    rowsOf,
    type Focus,
    type TreeMove,
    type TreeNode,
    type TreeState,
} from './treeModel.ts';

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

export const useTreeState = <T extends TreeNode>(nodes: T[], options: TreeOptions<T>) => {
    const {
        textOf,
        collapsedDepth = 1,
        onOpen,
    } = options;
    
    const [state, setState] = useState<TreeState>({
        collapsed: defaultCollapsed(nodes, collapsedDepth),
        selected: null,
        query: '',
        focus: 'tree',
    });
    
    /**
     * The listener itself never changes identity, so the callback ref below
     * attaches it exactly once. `latest` holds the current closure, which is
     * rebuilt whenever the state it reads changes; `onKeyDown` is the stable
     * face of it that the DOM knows about. A ref created with the first
     * closure would attach a no-op, because the callback ref runs before the
     * effect that would have filled it in.
     */
    const latest = useRef<((event: KeyboardEvent) => void) | null>(null);
    
    const onKeyDown = useRef((event: KeyboardEvent) => {
        const {current} = latest;
        
        if (current)
            current(event);
    }).current;
    
    /**
     * A query searches the whole tree, not the folded view. Filtering only what
     * is drawn makes a match unreachable: the default fold hides everything
     * below depth 1, so searching for a deep node type finds nothing and the
     * search looks broken. Folding and searching are two different intentions,
     * so the query wins — and clearing it restores the folds.
     */
    const rows = useCallback(() => filterNodes(
        rowsOf(
            nodes,
            state.collapsed,
            state.query,
            textOf,
        ),
        state.query,
        textOf,
    ), [
        nodes,
        state.collapsed,
        state.query,
        textOf,
    ]);
    
    const toggle = useCallback((id: string) => setState((previous) => {
        const collapsed = new Set(previous.collapsed);
        
        if (collapsed.has(id))
            collapsed.delete(id);
        else
            collapsed.add(id);
        
        return {
            ...previous,
            collapsed,
        };
    }), []);
    
    const select = useCallback((id: string) => setState((previous) => ({
        ...previous,
        selected: id,
    })), []);
    
    const setQuery = useCallback((query: string) => setState((previous) => ({
        ...previous,
        query,
    })), []);
    
    const setFocus = useCallback((focus: Focus) => setState((previous) => ({
        ...previous,
        focus,
    })), []);
    
    const move = useCallback((step: number) => setState((previous) => {
        const shown = rowsOf(nodes, previous.collapsed, previous.query, textOf);
        
        if (!shown.length)
            return previous;
        
        const at = shown.findIndex(({id}) => id === previous.selected);
        
        const next = at === -1 ? 0 : Math.min(Math.max(at + step, 0), shown.length - 1);
        
        return {
            ...previous,
            selected: shown[next].id,
        };
    }), [nodes]);
    
    /**
     * Applying a `TreeMove` in one place, so `ArrowLeft` and `ArrowRight` are
     * the only two keys that know the tree has folds at all. `fold` toggles
     * because that is what a collapsed node wants and what an expanded one wants
     * — the two arrows are the same verb pointed at opposite ends.
     */
    const applyMove = useCallback((move: TreeMove) => {
        if (move.kind === 'noop')
            return;
        
        if (move.kind === 'fold') {
            toggle(move.id);
            select(move.id);
            
            return;
        }
        
        select(move.id);
    }, [select, toggle]);
    
    /**
     * The root div, kept on a ref because two things need it and neither can get
     * it any other way: the `keydown` listener binds to *this* tree's own element
     * — two trees on one page each keep their own selection — and `goToTree` has
     * to put **real** focus back on it.
     */
    const element = useRef<HTMLDivElement | null>(null);
    
    /**
     * Leave the filter and move real focus to the tree. Call it from the key
     * handler, not from an effect on `state.focus`: `onBlur` also sets the
     * focus, and an effect would take focus from the next click.
     */
    const goToTree = useCallback(() => {
        setQuery('');
        setFocus('tree');
        
        // Bound to a local, which is the only form that both narrows and stops
        
        // reading `.current` twice: it is mutable, so two reads are two values as
        
        // far as the compiler is concerned. Optional chaining is off in this repo
        
        // for the same reason.
        const {current} = element;
        
        if (current)
            current.focus();
    }, [setFocus, setQuery]);
    
    useEffect(() => {
        latest.current = (event: KeyboardEvent) => {
            const {key} = event;
            
            if (state.focus === 'search') {
                /*
                 * `Escape`, `k` and `ArrowUp` leave the filter and clear it.
                 * `preventDefault`: the target is the input, so `k` would stay in it.
                 */
                if (key === 'Escape' || key === 'k' || key === 'ArrowUp') {
                    event.preventDefault();
                    goToTree();
                }
                
                // `Tab` is handled here rather than left to the browser so the
                // cycle closes in the tree: the plan's order is tree -> filter ->
                // tree, and letting the browser walk its own tab order instead
                // would put whatever is between the two in between them.
                if (key === 'Tab') {
                    event.preventDefault();
                    goToTree();
                }
                
                return;
            }
            
            // `Tab` out of the tree and into the filter. `preventDefault` is
            // what keeps the handler's answer: without it the browser also moves
            // focus, and the two race for the same element.
            if (key === 'Tab') {
                event.preventDefault();
                setFocus('search');
                
                return;
            }
            
            if (key === 'ArrowDown' || key === 'j') {
                move(1);
                
                return;
            }
            
            if (key === 'ArrowUp' || key === 'k') {
                // `k` on the first row moves focus to the filter, which is above the tree.
                const shown = rowsOf(nodes, state.collapsed, state.query, textOf);
                const atTop = shown.length > 0 && state.selected === shown[0].id;
                
                if (atTop) {
                    setFocus('search');
                    
                    return;
                }
                
                move(-1);
                
                return;
            }
            
            if (key === 'ArrowRight' || key === 'l') {
                const shown = rowsOf(nodes, state.collapsed, state.query, textOf);
                
                applyMove(expandMove(nodes, state.collapsed, state.selected, shown));
                
                return;
            }
            
            if (key === 'ArrowLeft' || key === 'h') {
                applyMove(foldMove(nodes, state.collapsed, state.selected));
                
                return;
            }
            
            /**
             * Enter/space: a container toggles; a leaf opens when the caller
             * gives `onOpen`, else toggles (a no-op). `hasChildren` asks over
             * all nodes: a folded subtree hides its children.
             */
            if (key === 'Enter' || key === ' ') {
                if (!state.selected)
                    return;
                
                if (onOpen && !hasChildren(nodes, state.selected)) {
                    const node = nodes.find(({id}) => id === state.selected) as T;
                    
                    onOpen(node);
                    
                    return;
                }
                
                toggle(state.selected);
                
                return;
            }
            
            if (key === '/')
                setFocus('search');
        };
    }, [
        applyMove,
        goToTree,
        move,
        nodes,
        onOpen,
        setFocus,
        setQuery,
        state.collapsed,
        state.focus,
        state.query,
        state.selected,
        textOf,
        toggle,
    ]);
    
    /**
     * A callback ref: it gets the root element of this tree, so the listener
     * binds there. React calls it with `null` on unmount. `goToTree` uses the
     * element to move focus.
     */
    const root = useCallback((node: HTMLDivElement | null) => {
        const previous = element.current;
        
        if (previous !== null)
            previous.removeEventListener('keydown', onKeyDown);
        
        if (node === null)
            return;
        
        element.current = node;
        node.addEventListener('keydown', onKeyDown);
    }, [onKeyDown]);
    
    return {
        ...state,
        root,
        visible: rows(),
        toggle,
        select,
        setQuery,
        setFocus,
        move,
    };
};
