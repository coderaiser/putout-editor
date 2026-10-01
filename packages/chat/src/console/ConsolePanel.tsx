import {AstTree} from '@putout/editor-commands';
import type {ConsoleAst} from '../hooks/useConsole.ts';

export interface ConsolePanelProps {
    ast: ConsoleAst | null;
}

/**
 * The tree beside the thread, rendering the same `AstTree` an `/ast` message
 * does. Two instances can be on the page at once, and they do not fight: each
 * `useTreeState` binds its keydown listener to its own root div rather than to
 * `document`, so a keypress reaches one tree and not both.
 */
export default function ConsolePanel({ast}: ConsolePanelProps) {
    if (!ast)
        return (
            <div
                className="console-panel console-panel--empty"
                data-testid="console-panel"
            >
                {'Run /ast to populate the tree'}
            </div>
        );
    
    return (
        <div
            className="console-panel"
            data-testid="console-panel"
        >
            <AstTree
                nodes={ast.nodes}
                source={ast.source}
            />
        </div>
    );
}
