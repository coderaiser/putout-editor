import {useChat} from '../hooks/useChat.ts';
import SourceBlock from './SourceBlock.tsx';

export interface TryItBlockProps {
    source: string;
}

/**
 * The `[try it →]` half of an opened leaf.
 *
 * Two commands in one click: `source` to put the example in the buffer, then
 * `ast` to draw its tree below — the same two lines a user would type. The
 * `ast` send takes the source **explicitly** rather than from the store, because
 * the store is only updated after a re-render and the closure here still holds
 * the value from *before* the first send ran, which is exactly the trap
 * `useChat`'s `send` comment warns `rest` recursion against.
 *
 * `SourceBlock` rather than a bare `<pre>`: the thread already reads line
 * numbers as positions, and an example without them would be the one block on
 * the page whose lines a later `line:col` cannot mean.
 */
export default function TryItBlock({source}: TryItBlockProps) {
    const {send} = useChat();
    
    const onTryIt = async () => {
        await send(`/source\n${source}`);
        await send('/ast', source);
    };
    
    return (
        <div
            className="tryit-block"
            data-testid="tryit-block"
        >
            <SourceBlock data={source}/>
            <button
                className="tryit-block__button"
                data-testid="try-it"
                onClick={onTryIt}
                type="button"
            >
                {'try it →'}
            </button>
        </div>
    );
}
