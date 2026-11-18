import {
    defaultCollapsed,
    rowsOf,
    type Focus,
    type TreeNode,
    type TreeState,
} from './treeModel.ts';

interface MoveAction<T extends TreeNode> {
    kind: 'move';
    step: number;
    nodes: T[];
    textOf: (node: T) => string;
}

/**
 * What can happen to a tree. `fold` is a toggle and a select in one step:
 * the two arrow keys use it, and two steps would draw one frame in between.
 * `leave` clears the query and gives the focus back to the tree. `move`
 * carries the rows and the accessor, because the rows a step walks depend on
 * the fold and the query of the state it is applied to.
 */
export type TreeAction<T extends TreeNode> =
    | {
        kind: 'toggle';
        id: string;
    }
    | {
        kind: 'select';
        id: string;
    }
    | {
        kind: 'fold';
        id: string;
    }
    | {
        kind: 'query';
        query: string;
    }
    | {
        kind: 'focus';
        focus: Focus;
    }
    | {
        kind: 'leave';
    }
    | MoveAction<T>;

export const createTreeState = <T extends TreeNode>(nodes: T[], collapsedDepth: number): TreeState => ({
    collapsed: defaultCollapsed(nodes, collapsedDepth),
    selected: null,
    query: '',
    focus: 'tree',
});

const toggled = (collapsed: Set<string>, id: string): Set<string> => {
    const result = new Set(collapsed);
    
    if (result.has(id))
        result.delete(id);
    else
        result.add(id);
    
    return result;
};

const moved = <T extends TreeNode>(state: TreeState, {step, nodes, textOf}: MoveAction<T>): TreeState => {
    const shown = rowsOf(nodes, state.collapsed, state.query, textOf);
    
    if (!shown.length)
        return state;
    
    const at = shown.findIndex(({id}) => id === state.selected);
    const next = at === -1 ? 0 : Math.min(Math.max(at + step, 0), shown.length - 1);
    
    return {
        ...state,
        selected: shown[next].id,
    };
};

export const treeReducer = <T extends TreeNode>(state: TreeState, action: TreeAction<T>): TreeState => {
    if (action.kind === 'toggle')
        return {
            ...state,
            collapsed: toggled(state.collapsed, action.id),
        };
    
    if (action.kind === 'select')
        return {
            ...state,
            selected: action.id,
        };
    
    if (action.kind === 'fold')
        return {
            ...state,
            collapsed: toggled(state.collapsed, action.id),
            selected: action.id,
        };
    
    if (action.kind === 'query')
        return {
            ...state,
            query: action.query,
        };
    
    if (action.kind === 'focus')
        return {
            ...state,
            focus: action.focus,
        };
    
    if (action.kind === 'leave')
        return {
            ...state,
            query: '',
            focus: 'tree',
        };
    
    return moved(state, action);
};
