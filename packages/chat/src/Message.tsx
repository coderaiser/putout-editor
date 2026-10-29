import type {Message as MessageModel} from '#store';
import {prefixOf} from './sigil.ts';
import TextBlock from './messages/TextBlock.tsx';
import ErrorBlock from './messages/ErrorBlock.tsx';
import SourceBlock from './messages/SourceBlock.tsx';
import HelpBlock from './messages/HelpBlock.tsx';
import PlacesList from './messages/PlacesList.tsx';
import TransformDiff from './messages/TransformDiff.tsx';
import AstBlock from './messages/AstBlock.tsx';
import LearnBlock from './messages/LearnBlock.tsx';
import TryItBlock from './messages/TryItBlock.tsx';
import FlowBlock from './messages/FlowBlock.tsx';

export interface MessageProps {
    message: MessageModel;
}

/**
 * `help` answers with `text`, so find it by the command name, like `useChat`
 * finds `clear` and `reset`. Only `help` gets the table.
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
    
    // `learn` and `tryit` come after `ast` and before the arms below, because
    // they are new results with their own shapes — falling through to `text` or
    // `source` would render a tree as a paragraph.
    if (result.type === 'learn')
        return (
            <LearnBlock tree={result.tree}/>
        );
    
    if (result.type === 'tryit')
        return (
            <TryItBlock source={result.source}/>
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
    
    if (result.type === 'flow') {
        const {blocks, source} = result;
        
        return (
            <FlowBlock
                blocks={blocks}
                source={source}
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
