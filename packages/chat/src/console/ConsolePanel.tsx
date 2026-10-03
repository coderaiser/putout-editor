import {useDispatch} from 'react-redux';
import {toggleConsole} from '#store';
import AstTree from '../components/AstTree.tsx';
import type {ConsoleAst} from '../hooks/useConsole.ts';

export interface ConsolePanelProps {
    ast: ConsoleAst | null;
}

/**
 * The tree beside the thread, rendering the same `AstTree` an `/ast` message
 * does. Two instances can be on the page at once, and they do not fight: each
 * `useTreeState` binds its keydown listener to its own root div rather than to
 * `document`, so a keypress reaches one tree and not both.
 *
 * The `✕` is here rather than in the header because this is the one thing the
 * header control could not do. Toggling a panel *open* has two ways already —
 * `/console`, and `/ast` opening it to show what it just parsed — but closing
 * it meant typing a command to dismiss something you opened by clicking, and a
 * panel covering half the thread with no way out of it is a trap rather than a
 * control. It dispatches `toggleConsole`, the same action `/console` does, so
 * the two cannot leave the panel in different states.
 */
export default function ConsolePanel({ast}: ConsolePanelProps) {
    const dispatch = useDispatch();
    
    const header = (
        <div className="console-panel__header">
            <span className="console-panel__title">
                {'AST'}
            </span>
            <button
                aria-label="Close console"
                className="chat-header__btn"
                data-testid="console-close"
                onClick={() => dispatch(toggleConsole())}
                type="button"
            >
                {'✕'}
            </button>
        </div>
    );
    
    if (!ast)
        return (
            <div
                className="console-panel console-panel--empty"
                data-testid="console-panel"
            >
                {header}
                <span
                    className="console-panel__hint"
                    data-testid="console-empty"
                >
                    {'Run /ast to populate the tree'}
                </span>
            </div>
        );
    
    return (
        <div
            className="console-panel"
            data-testid="console-panel"
        >
            {header}
            <AstTree
                nodes={ast.nodes}
                source={ast.source}
            />
        </div>
    );
}
