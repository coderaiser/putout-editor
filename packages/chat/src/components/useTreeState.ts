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
    
    useEffect(() => {
        latest.current = (event: KeyboardEvent) => {
            const {key} = event;
            
            if (state.focus === 'search') {
                if (key === 'Escape') {
                    setQuery('');
                    setFocus('tree');
                }
                
                return;
            }
            
            if (key === 'ArrowDown' || key === 'j') {
                move(1);
                
                return;
            }
            
            if (key === 'ArrowUp' || key === 'k') {
                move(-1);
                
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
        move,
        setFocus,
        setQuery,
        state.focus,
        state.selected,
        toggle,
    ]);
    
    /**
     * A callback ref rather than `useRef` + `useEffect`: the listener has to be
     * bound to this tree's own root div, and a callback ref is the only place
     * that knows the element. It is also the only version whose `null` case is
     * real — React calls it on unmount, so the detach path is exercised rather
     * than being a branch nothing can reach.
     */
    const root = useCallback((element: HTMLDivElement | null) => {
        if (element === null)
            return;
        
        element.removeEventListener('keydown', onKeyDown);
        element.addEventListener('keydown', onKeyDown);
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
