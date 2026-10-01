import type {Message as MessageModel} from '#store';
import TextBlock from './messages/TextBlock.tsx';
import ErrorBlock from './messages/ErrorBlock.tsx';
import SourceBlock from './messages/SourceBlock.tsx';
import PlacesList from './messages/PlacesList.tsx';
import TransformDiff from './messages/TransformDiff.tsx';
import AstBlock from './messages/AstBlock.tsx';

export interface MessageProps {
    message: MessageModel;
}

/**
 * `/help` answers with `text` too — its data is the formatted table — so it is
 * recognised by the command that produced it rather than by its result type.
 * That is the same reason `useChat` keys `/clear` and `/reset` on their names.
 */
const Result = ({message}: MessageProps) => {
    const {result} = message;
    
    if (!result)
        return null;
    
    if (result.type === 'error')
        return (
            <ErrorBlock message={result.message}/>
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
