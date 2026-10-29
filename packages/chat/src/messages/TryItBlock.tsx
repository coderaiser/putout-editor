import {useChat} from '../hooks/useChat.ts';
import SourceBlock from './SourceBlock.tsx';

export interface TryItBlockProps {
    source: string;
}

/**
 * `[try it →]`: send `source` with the example, then `ast`. Give `ast` the
 * source explicitly: the store updates after a render. `SourceBlock` shows
 * line numbers, like other blocks.
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
