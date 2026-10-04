import {useSelector} from 'react-redux';
import type {RootState} from '#store/types';
import {useConsole} from './hooks/useConsole.ts';
import Chat from './Chat.tsx';
import ConsolePanel from './console/ConsolePanel.tsx';
import ThemeToggle from './ThemeToggle.tsx';

/**
 * The page: a header, the thread, and the console panel when it is open. The
 * panel is hidden by default — `consoleOpen` starts `false` in the slice — so
 * anything testing the console has to open it first, and the two ways to do
 * that are both inside the thread rather than in this header: `console`, and
 * `ast` opening it to show what it just parsed.
 *
 * There was a header button here, and what it cost is the reason it is gone.
 * A control that opens a panel already has a command that opens it, and the
 * button had to keep a piece of state in sync with it — plus its own label, its
 * own active class, and three tests. The panel's own `✕` covers the case the
 * button did not: dismissing it without typing a command.
 */
export default function App() {
    const consoleOpen = useSelector((root: RootState) => root.chat.consoleOpen);
    const ast = useConsole();
    
    return (
        <div
            className={[
                'chat-app',
                consoleOpen && 'chat-app--split',
            ]
                .filter(Boolean)
                .join(' ')}
            data-testid="app"
        >
            <header className="chat-header">
                <span className="chat-header__title">
                    {'🐊 putout chat'}
                </span>
                <ThemeToggle/>
            </header>
            <div className="chat-app__body">
                <Chat/>
                {consoleOpen && (
                    <div className="chat-console">
                        <ConsolePanel ast={ast}/>
                    </div>
                )}
            </div>
        </div>
    );
}
