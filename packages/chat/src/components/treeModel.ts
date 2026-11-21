/**
 * The fields of each tree row. `FlatNode` and `FlatLearnNode` have them, so
 * one widget serves both trees. The row text and the query target are
 * options.
 */
export interface TreeNode {
    id: string;
    pid: string | null;
    depth: number;
}

export type Focus = 'search' | 'tree';

export interface TreeState {
    collapsed: Set<string>;
    selected: string | null;
    query: string;
    focus: Focus;
}

export interface Visible<T> {
    /** The rows to draw, in order. */
    rows: T[];
    
    /** Ids whose own text matches the query, for the amber highlight. */
    matched: Set<string>;
    
    /** Ids on the path to a match, kept visible but dimmed. */
    dimmed: Set<string>;
}

/** Ids a query touches, plus every ancestor of each, so a match is reachable. */
export function withAncestors<T extends TreeNode>(matched: Set<string>, nodes: T[]): Set<string> {
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

export const filterNodes = <T extends TreeNode>(nodes: T[], query: string, textOf: (node: T) => string): Visible<T> => {
    const needle = query
        .trim()
        .toLowerCase();
    
    if (!needle)
        return {
            rows: nodes,
            matched: new Set<string>(),
            dimmed: new Set<string>(),
        };
    
    const matchesNeedle = (node: T) => textOf(node)
        .toLowerCase()
        .includes(needle);
    
    const toId = ({id}: T) => id;
    
    const matched = new Set<string>(nodes
        .filter(matchesNeedle)
        .map(toId));
    
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

/**
 * Ids that are collapsed by default: every node deeper than `belowDepth`.
 *
 * `belowDepth` rather than a folded-in `1` because the two trees want different
 * things and the difference is one number — see `TreeOptions.collapsedDepth`.
 */
export function defaultCollapsed<T extends TreeNode>(nodes: T[], belowDepth = 1): Set<string> {
    return new Set(nodes
        .filter(({depth}) => depth > belowDepth)
        .map(({id}) => id));
}

/** The rows a collapsed set leaves visible, keeping a collapsed node's children hidden. */
export const visibleRows = <T extends TreeNode>(nodes: T[], collapsed: Set<string>): T[] => {
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
 * What a query sees, which is every node when there is one and the folded
 * view when there is not. A blank query is no query. Shared by the render and
 * by keyboard navigation, so `j` cannot walk to a row that is not drawn.
 */
export const visibleOf = <T extends TreeNode>(nodes: T[], collapsed: Set<string>, query: string, textOf: (node: T) => string): Visible<T> => {
    if (query.trim())
        return filterNodes(nodes, query, textOf);
    
    return {
        rows: visibleRows(nodes, collapsed),
        matched: new Set<string>(),
        dimmed: new Set<string>(),
    };
};

/** The rows `visibleOf` draws, without the highlight sets. */
export const rowsOf = <T extends TreeNode>(nodes: T[], collapsed: Set<string>, query: string, textOf: (node: T) => string): T[] => visibleOf(nodes, collapsed, query, textOf).rows;

/**
 * What `ArrowLeft` / `ArrowRight` do. `fold`: collapse or expand this node.
 * `walk`: select another node. `noop`: the end of the tree.
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
export const expandMove = <T extends TreeNode>(nodes: T[], collapsed: Set<string>, selected: string | null, shown: T[]): TreeMove => {
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
    
    const {id} = nodes.find(({id: nodeId}) => nodeId === selected) as T;
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
export const hasChildren = <T extends TreeNode>(nodes: T[], id: string): boolean => nodes.some(({pid}) => pid === id);

/**
 * `ArrowLeft`: collapse, or walk out.
 *
 * The mirror of `expandMove`. A node that is already collapsed hands over to its
 * parent — there is nothing further down to hide, so the next thing `ArrowRight`
 * would reveal is up here. A leaf stays put.
 */
export const foldMove = <T extends TreeNode>(nodes: T[], collapsed: Set<string>, selected: string | null): TreeMove => {
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

/** What a row needs to draw its branch lines. */
export interface Layout {
    /** The last child of its parent. A root is last. */
    last: boolean;
    
    /** Some node names this one as its parent. */
    hasChildren: boolean;
    
    /** One flag for each ancestor, root first: was that ancestor last? */
    ancestorLastFlags: boolean[];
}

const entryOf = <T extends TreeNode>(node: T): [string, T] => [node.id, node];

/**
 * The branch layout of each node, found once for the whole list.
 *
 * It reads all nodes, not the drawn rows: a folded subtree hides its last
 * child, and the `└─` must not move when it does. A node whose parent is not
 * in the list starts its own chain. The order of `nodes` is free.
 */
export const layoutOf = <T extends TreeNode>(nodes: T[]): Map<string, Layout> => {
    const byId = new Map(nodes.map(entryOf));
    const lastChild = new Map<string | null, string>();
    
    for (const {id, pid} of nodes)
        lastChild.set(pid, id);
    
    const lastOf = ({id, pid}: T) => pid === null || lastChild.get(pid) === id;
    
    const flagsOf = ({pid}: T): boolean[] => {
        const parent = pid === null ? undefined : byId.get(pid);
        
        if (!parent)
            return [];
        
        return [
            ...flagsOf(parent),
            lastOf(parent),
        ];
    };
    
    const layout = new Map<string, Layout>();
    
    for (const node of nodes)
        layout.set(node.id, {
            last: lastOf(node),
            hasChildren: lastChild.has(node.id),
            ancestorLastFlags: flagsOf(node),
        });
    
    return layout;
};
