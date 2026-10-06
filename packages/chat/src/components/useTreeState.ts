import type {FlatNode} from '@putout/editor-commands';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

export type Focus = 'search' | 'tree';

export interface TreeState {
    collapsed: Set<string>;
    selected: string | null;
    query: string;
    focus: Focus;
}

export interface Visible {
    /** The rows to draw, in order. */
    rows: FlatNode[];
    
    /** Ids whose own text matches the query, for the amber highlight. */
    matched: Set<string>;
    
    /** Ids on the path to a match, kept visible but dimmed. */
    dimmed: Set<string>;
}

/** Ids a query touches, plus every ancestor of each, so a match is reachable. */
export function withAncestors(matched: Set<string>, nodes: FlatNode[]): Set<string> {
    const parents = new Map(nodes.map(({id, pid}) => [id, pid]));
    
    const result = new Set(matched);
    
    for (const id of matched) {
        let pid = parents.get(id) || null;
        
        while (pid !== null) {
            result.add(pid);
            pid = parents.get(pid) || null;
        }
    }
    
    return result;
}

export const filterNodes = (nodes: FlatNode[], query: string): Visible => {
    const needle = query
        .trim()
        .toLowerCase();
    
    if (!needle)
        return {
            rows: nodes,
            matched: new Set<string>(),
            dimmed: new Set<string>(),
        };
    
    const matched = new Set<string>(nodes
        .filter(({type, detail}) => `${type} ${detail}`
            .toLowerCase()
            .includes(needle))
        .map(({id}) => id));
    
    const reachable = withAncestors(matched, nodes);
    const dimmed = new Set<string>();
    
    for (const id of reachable)
        if (!matched.has(id))
            dimmed.add(id);
    
    return {
        rows: nodes.filter(({id}) => reachable.has(id)),
        matched,
        dimmed,
    };
};

/** Ids that are collapsed by default: every node deeper than the second level. */
export function defaultCollapsed(nodes: FlatNode[]): Set<string> {
    return new Set(nodes
        .filter(({depth}) => depth > 1)
        .map(({id}) => id));
}

/** The rows a collapsed set leaves visible, keeping a collapsed node's children hidden. */
export const visibleRows = (nodes: FlatNode[], collapsed: Set<string>): FlatNode[] => {
    const parents = new Map(nodes.map(({id, pid}) => [id, pid]));
    
    return nodes.filter(({pid}) => {
        if (pid === null)
            return true;
        
        for (let parent: string | null = pid; parent !== null; parent = parents.get(parent) || null)
            if (collapsed.has(parent))
                return false;
        
        return true;
    });
};

/**
 * The rows a query sees, which is every node when there is one and the folded
 * view when there is not. Shared by the render and by keyboard navigation, so
 * `j` cannot walk to a row that is not drawn.
 */
export const rowsOf = (nodes: FlatNode[], collapsed: Set<string>, query: string): FlatNode[] => {
    if (query.trim())
        return filterNodes(nodes, query).rows;
    
    return visibleRows(nodes, collapsed);
};

/**
 * What `ArrowLeft` / `ArrowRight` do, as an action rather than an id.
 *
 * `fold` is "collapse this node in place" and `walk` is "select that other
 * node". Returning an id alone cannot express the difference, because
 * `ArrowRight` on a collapsed node and `ArrowLeft` on an expanded one both
 * answer "this same node" — and in one case the node has to expand and in the
 * other it has to collapse. So both moves say which, and the handler applies.
 *
 * `noop` is the end of the tree: a leaf asked to fold, a root asked to collapse.
 * Neither is an error, and both are what every tree viewer does.
 */
export type TreeMove = {
    kind: 'fold';
    id: string;
} | {
    kind: 'walk';
    id: string;
} | {
    kind: 'noop';
};

/**
 * `ArrowRight`: reveal the next level.
 *
 * A collapsed node expands where it stands, an expanded one hands over to its
 * first child. `shown` is passed rather than recomputed because the caller
 * already has it, and `rowsOf` over a live query is not free.
 */
export const expandMove = (nodes: FlatNode[], collapsed: Set<string>, selected: string | null, shown: FlatNode[]): TreeMove => {
    if (selected === null) {
        const [first] = shown;
        
        return first ? {
            kind: 'walk',
            id: first.id,
        } : {
            kind: 'noop',
        };
    }
    
    if (collapsed.has(selected))
        return {
            kind: 'fold',
            id: selected,
        };
    
    const {id} = nodes.find(({id: nodeId}) => nodeId === selected) as FlatNode;
    const child = nodes.find(({pid}) => pid === id);
    
    if (!child)
        return {
            kind: 'noop',
        };
    
    return {
        kind: 'walk',
        id: child.id,
    };
};

/**
 * Whether a node has any children at all, over the whole tree rather than the
 * drawn rows: a folded subtree's last child is not on screen, so asking only
 * what is visible would call a node a leaf the moment its sibling folded away.
 *
 * Top level rather than an arrow inside `foldMove` — the rule is a fixed point
 * here, and a named helper is what makes it one.
 */
export const hasChildren = (nodes: FlatNode[], id: string): boolean => nodes.some(({pid}) => pid === id);

/**
 * `ArrowLeft`: collapse, or walk out.
 *
 * The mirror of `expandMove`. A node that is already collapsed hands over to its
 * parent — there is nothing further down to hide, so the next thing `ArrowRight`
 * would reveal is up here. A leaf stays put.
 */
export const foldMove = (nodes: FlatNode[], collapsed: Set<string>, selected: string | null): TreeMove => {
    if (selected === null)
        return {
            kind: 'noop',
        };
    
    const node = nodes.find(({id}) => id === selected);
    
    if (!node)
        return {
            kind: 'noop',
        };
    
    const {pid} = node;
    
    if (collapsed.has(selected)) {
        if (pid === null)
            return {
                kind: 'noop',
            };
        
        return {
            kind: 'walk',
            id: pid,
        };
    }
    
    // Expanded. A node with nothing under it has nothing to collapse.
    if (!hasChildren(nodes, selected))
        return {
            kind: 'noop',
        };
    
    return {
        kind: 'fold',
        id: selected,
    };
};

export const useTreeState = (nodes: FlatNode[]) => {
    const [state, setState] = useState<TreeState>({
        collapsed: defaultCollapsed(nodes),
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
    const rows = useCallback(() => filterNodes(rowsOf(nodes, state.collapsed, state.query), state.query), [nodes, state.collapsed, state.query]);
    
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
        const shown = rowsOf(nodes, previous.collapsed, previous.query);
        
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
     * Leave the filter and take real focus back to the tree.
     *
     * `setFocus('tree')` alone is a lie the user can see: the state says the
     * tree is focused while the caret is still in the input, so the next
     * keypress goes into the filter. `AstSearch` has the mirror-image fix on its
     * side (`useEffect` on `focused` calls `input.focus()`), and this is its
     * partner.
     *
     * Called **from the handler** rather than from an effect keyed on
     * `state.focus`, because the input's `onBlur` also sets focus back to the
     * tree — an effect would then yank focus out of whatever the user clicked
     * next. Only a keypress means "go there on purpose".
     *
     * Declared above the key handler because that handler closes over it.
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
                // `Escape` and `k`/`ArrowUp` are the same verb: leave the filter
                // and take the text with it. Clearing matters as much as the
                // focus move — a filter that keeps its query but loses focus
                // leaves a filtered tree with no filter box and no way back.
                //
                // `preventDefault` is **not** optional here. The listener is on
                // `.ast` and the event's target is the input, so the browser
                // still inserts the character unless the default is cancelled:
                // `k` would both leave the filter *and* leave a `k` behind in it.
                // The unit specs cannot see this — they assert the state, and the
                // state was right — which is why the e2e presses a real key.
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
                // `k` on the **first** row hands over to the filter, which is
                // what plan.md's cycle diagram says — "k / ArrowUp (from Program
                // = first row) → moves focus to filter input".
                //
                // The prose under the diagram says `j`/`ArrowDown` here
                // instead, and that cannot be what was meant: `defaultCollapsed`
                // folds everything below depth 1, so the tree draws **two** rows
                // by default, and `j` on the first of two rows can never reach
                // the second. That reading breaks navigation outright, and three
                // specs that walked the tree with `ArrowDown` caught it. `k` is
                // also the honest direction: the filter bar renders *above* the
                // tree, so up from the top row is where it is.
                const shown = rowsOf(nodes, state.collapsed, state.query);
                const atTop = shown.length > 0 && state.selected === shown[0].id;
                
                if (atTop) {
                    setFocus('search');
                    
                    return;
                }
                
                move(-1);
                
                return;
            }
            
            if (key === 'ArrowRight' || key === 'l') {
                const shown = rowsOf(nodes, state.collapsed, state.query);
                
                applyMove(expandMove(nodes, state.collapsed, state.selected, shown));
                
                return;
            }
            
            if (key === 'ArrowLeft' || key === 'h') {
                applyMove(foldMove(nodes, state.collapsed, state.selected));
                
                return;
            }
            
            if (key === 'Enter' || key === ' ') {
                if (state.selected)
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
        setFocus,
        setQuery,
        state.collapsed,
        state.focus,
        state.query,
        state.selected,
        toggle,
    ]);
    
    /**
     * A callback ref rather than `useRef` + `useEffect`: the listener has to be
     * bound to this tree's own root div, and a callback ref is the only place
     * that knows the element. It is also the only version whose `null` case is
     * real — React calls it on unmount, so the detach path is exercised rather
     * than being a branch nothing can reach.
     *
     * The element is kept on the way through, because `goToTree` above has to
     * put **real** focus back on this div and a callback ref is the only handle
     * that has it.
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
