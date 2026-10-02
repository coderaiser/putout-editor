import {useDispatch, useSelector} from 'react-redux';
import {toggleConsole} from '#store';
import type {RootState} from '#store/types';
import {useConsole} from './hooks/useConsole.ts';
import Chat from './Chat.tsx';
import ConsolePanel from './console/ConsolePanel.tsx';

/**
 * The page: a header, the thread, and the console panel when it is open. The
 * panel is hidden by default — `consoleOpen` starts `false` in the slice — so
 * anything testing the console has to open it first.
 *
 * The header control dispatches `toggleConsole` itself rather than routing
 * through the `/console` command: the command exists so the button's state has
 * one source of truth, and a click has to be a click rather than a line typed
 * into a box. Both go through the same reducer, so the two cannot disagree.
 */
export default function App() {
    const dispatch = useDispatch();
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
                <button
                    className={[
                        'chat-header__btn',
                        consoleOpen && 'chat-header__btn--active',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    data-testid="console-toggle"
                    onClick={() => dispatch(toggleConsole())}
                    type="button"
                >
                    {`console ${consoleOpen ? '⊟' : '⊞'}`}
                </button>
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
