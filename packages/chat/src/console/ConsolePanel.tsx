import {useDispatch} from 'react-redux';
import {toggleConsole} from '#store';
import {useIsMobile} from '../hooks/useIsMobile.ts';
import AstTree from '../components/AstTree.tsx';
import type {ConsoleAst} from '../hooks/useConsole.ts';

export interface ConsolePanelProps {
    ast: ConsoleAst | null;
}

/**
 * The tree beside the thread, the same `AstTree` as an `ast` message. Each
 * `useTreeState` listens on its own root, so two trees do not conflict.
 * `✕` dispatches `toggleConsole`, like `console`. `useIsMobile()` is here:
 * it is a page property, not a tree property.
 */
export default function ConsolePanel({ast}: ConsolePanelProps) {
    const dispatch = useDispatch();
    const mobile = useIsMobile();
    
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
                    {'Run ast to populate the tree'}
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
                mobile={mobile}
                nodes={ast.nodes}
                source={ast.source}
            />
        </div>
    );
}
