import type {Message as MessageModel} from '#store';
import {prefixOf} from './sigil.ts';
import TextBlock from './messages/TextBlock.tsx';
import ErrorBlock from './messages/ErrorBlock.tsx';
import SourceBlock from './messages/SourceBlock.tsx';
import HelpBlock from './messages/HelpBlock.tsx';
import PlacesList from './messages/PlacesList.tsx';
import TransformDiff from './messages/TransformDiff.tsx';
import AstBlock from './messages/AstBlock.tsx';

export interface MessageProps {
    message: MessageModel;
}

/**
 * `help` answers with `text` — its data is the formatted list — so it is
 * recognised by **the command that produced it**, not by its result type, which
 * is the same reason `useChat` keys `clear` and `reset` on their names. Only
 * `help` gets the table; every other `text` answer stays a `TextBlock`.
 *
 * This is what makes `HelpBlock` reachable at all. It had three specs and no
 * call site: `help` rendered as plain text, so the table was built, tested and
 * never shown — a component with full coverage that no user could see. The
 * seeded opening thread needs `help` to *be* the help, so this is the branch
 * that shows it.
 */
const Result = ({message}: MessageProps) => {
    const {result, text} = message;
    
    if (!result)
        return null;
    
    if (result.type === 'error')
        return (
            <ErrorBlock message={result.message}/>
        );
    
    // `prefixOf`, not an exact match: the thread now shows the sigil the user
    // typed, so `/help` is the same answer as `help` — and comparing against the
    // bare literal silently stopped rendering the table for every line the page
    // itself accepts, which is how `HelpBlock` became unreachable again.
    if (prefixOf(text) === 'help' && result.type === 'text')
        return (
            <HelpBlock/>
        );
    
    if (result.type === 'ast')
        return (
            <AstBlock
                nodes={result.nodes}
                source={result.source}
            />
        );
    
    if (result.type === 'source')
        return (
            <SourceBlock data={result.data}/>
        );
    
    if (result.type === 'places')
        return (
            <PlacesList data={result.data}/>
        );
    
    if (result.type === 'transform') {
        const {before, after} = result;
        
        return (
            <TransformDiff
                after={after}
                before={before}
            />
        );
    }
    
    return (
        <TextBlock data={result.data}/>
    );
};

export default function Message({message}: MessageProps) {
    return (
        <div
            className="message message--system"
            data-testid="message"
        >
            <Result message={message}/>
        </div>
    );
}
