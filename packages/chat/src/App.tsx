import {useSelector} from 'react-redux';
import type {RootState} from '#store/types';

/**
 * The page: a header, the thread, and the console panel when `/console` has
 * opened it. The panel is hidden by default — `consoleOpen` starts `false` in
 * the slice — so anything testing the console has to issue `/console` first.
 */
import {useConsole} from './hooks/useConsole.ts';
import Chat from './Chat.tsx';
import ConsolePanel from './console/ConsolePanel.tsx';

/**
 * The page: a header, the thread, and the console panel when `/console` has
 * opened it. The panel is hidden by default — `consoleOpen` starts `false` in
 * the slice — so anything testing the console has to issue `/console` first.
 */
export default function App() {
    const consoleOpen = useSelector((root: RootState) => root.chat.consoleOpen);
    const ast = useConsole();
    
    return (
        <div
            className={[
                'app',
                consoleOpen && 'app--split',
            ]
                .filter(Boolean)
                .join(' ')}
            data-testid="app"
        >
            <header className="app__header">
                <h1 className="app__title">
                    {'putout editor'}
                </h1>
                <span
                    className="app__console"
                    data-testid="console-toggle"
                >
                    {consoleOpen ? '[hide console]' : '[console]'}
                </span>
            </header>
            <div className="app__body">
                <Chat/>
                {consoleOpen && (
                    <ConsolePanel ast={ast}/>
                )}
            </div>
        </div>
    );
}
