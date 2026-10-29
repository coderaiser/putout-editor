import {useSelector} from 'react-redux';
import type {RootState} from '#store/types';
import {useConsole} from './hooks/useConsole.ts';
import Chat from './Chat.tsx';
import ConsolePanel from './console/ConsolePanel.tsx';
import ThemeToggle from './ThemeToggle.tsx';

/**
 * The page: header, thread, and the console panel when open. The panel is
 * closed at start. `console` or `ast` opens it; its `✕` closes it.
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
