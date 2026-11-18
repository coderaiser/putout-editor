import type {TreeAction} from './treeReducer.ts';
import {
    expandMove,
    foldMove,
    hasChildren,
    rowsOf,
    type Focus,
    type TreeMove,
    type TreeNode,
} from './treeModel.ts';

/** What a key needs to know. `canOpen` is whether the caller gave `onOpen`. */
export interface KeyContext<T extends TreeNode> {
    nodes: T[];
    collapsed: Set<string>;
    selected: string | null;
    query: string;
    focus: Focus;
    textOf: (node: T) => string;
    canOpen: boolean;
}

/**
 * What a key does. `action` goes to the reducer. `open` is the row to hand to
 * `onOpen`. `prevent` is a `preventDefault` on the event. `focusRoot` moves
 * real focus to the root of the tree. A key that means nothing has all four
 * empty, and the caller does not touch the event.
 */
export interface KeyResult<T extends TreeNode> {
    action: TreeAction<T> | null;
    open: T | null;
    prevent: boolean;
    focusRoot: boolean;
}

const none = <T extends TreeNode>(): KeyResult<T> => ({
    action: null,
    open: null,
    prevent: false,
    focusRoot: false,
});

const act = <T extends TreeNode>(action: TreeAction<T>, prevent = false): KeyResult<T> => ({
    ...none<T>(),
    action,
    prevent,
});

const goToFilter = <T extends TreeNode>(prevent = false): KeyResult<T> => act<T>({
    kind: 'focus',
    focus: 'search',
}, prevent);

/**
 * `fold` toggles because that is what a collapsed node wants and what an
 * expanded one wants: the two arrows are the same verb pointed at opposite ends.
 */
const applyMove = <T extends TreeNode>(move: TreeMove): KeyResult<T> => {
    if (move.kind === 'fold')
        return act<T>({
            kind: 'fold',
            id: move.id,
        });
    
    if (move.kind === 'walk')
        return act<T>({
            kind: 'select',
            id: move.id,
        });
    
    return none<T>();
};

/**
 * The filter owns `Escape`, `k`, `ArrowUp` and `Tab`: each one leaves it and
 * clears it. `preventDefault` is what keeps `k` out of the input, and what
 * closes the `Tab` cycle in the tree — tree, filter, tree — instead of
 * letting the browser walk whatever sits between the two.
 */
const inFilter = <T extends TreeNode>(key: string): KeyResult<T> => {
    if (key === 'Escape' || key === 'k' || key === 'ArrowUp' || key === 'Tab')
        return {
            ...act<T>({
                kind: 'leave',
            }, true),
            focusRoot: true,
        };
    
    return none<T>();
};

/**
 * Enter or space: a container toggles. A leaf opens when the caller gives
 * `onOpen`, and toggles when it does not. `hasChildren` asks over every
 * node: a folded subtree hides its children.
 */
const onEnter = <T extends TreeNode>({nodes, selected, canOpen}: KeyContext<T>): KeyResult<T> => {
    if (!selected)
        return none<T>();
    
    const row = nodes.find(({id}) => id === selected);
    
    if (canOpen && row && !hasChildren(nodes, selected))
        return {
            ...none<T>(),
            open: row,
        };
    
    return act<T>({
        kind: 'toggle',
        id: selected,
    });
};

/** `k` on the first row goes to the filter, which sits above the tree. */
const onUp = <T extends TreeNode>(context: KeyContext<T>): KeyResult<T> => {
    const {
        nodes,
        collapsed,
        selected,
        query,
        textOf,
    } = context;
    
    const [first] = rowsOf(nodes, collapsed, query, textOf);
    
    if (first && selected === first.id)
        return goToFilter<T>();
    
    return act<T>({
        kind: 'move',
        step: -1,
        nodes,
        textOf,
    });
};

export const keyToAction = <T extends TreeNode>(key: string, context: KeyContext<T>): KeyResult<T> => {
    const {
        nodes,
        collapsed,
        selected,
        query,
        focus,
        textOf,
    } = context;
    
    if (focus === 'search')
        return inFilter<T>(key);
    
    if (key === 'Tab')
        return goToFilter<T>(true);
    
    if (key === 'ArrowDown' || key === 'j')
        return act<T>({
            kind: 'move',
            step: 1,
            nodes,
            textOf,
        });
    
    if (key === 'ArrowUp' || key === 'k')
        return onUp<T>(context);
    
    if (key === 'ArrowRight' || key === 'l')
        return applyMove<T>(expandMove(
            nodes,
            collapsed,
            selected,
            rowsOf(
                nodes,
                collapsed,
                query,
                textOf,
            ),
        ));
    
    if (key === 'ArrowLeft' || key === 'h')
        return applyMove<T>(foldMove(nodes, collapsed, selected));
    
    if (key === 'Enter' || key === ' ')
        return onEnter<T>(context);
    
    if (key === '/')
        return goToFilter<T>();
    
    return none<T>();
};
