import {useEffect, useRef} from 'react';
import {useChat} from './hooks/useChat.ts';
import Input from './Input.tsx';
import MessageRow from './Message.tsx';
import SourceBlock from './messages/SourceBlock.tsx';

/** The /source echo: everything after the first line, rendered through
 * SourceBlock's highlighting instead of plain text. */
const getSourceBody = (text: string): string => {
    const index = text.indexOf('\n');
    
    if (index === -1)
        /* c8 ignore next */
        return '';
    
    return text.slice(index + 1);
};

/** The /source echo: everything before the first newline, and only if it is
 * a /source command. */
const getSourceHeader = (text: string): string => {
    const index = text.indexOf('\n');
    
    if (index === -1)
        return text;
    
    return text.slice(0, index);
};

/** The thread and the input. The console panel is `App`'s business, not this. */
export default function Chat() {
    const {
        send,
        messages,
        history,
    } = useChat();
    
    const thread = useRef<HTMLDivElement>(null);
    
    /**
     * Keep the newest message in view on each message change: the answer
     * lands below the fold of a full thread. Scroll the thread element.
     * On load, this opens the thread at its end.
     */
    useEffect(() => {
        const node = thread.current;
        
        if (node)
            node.scrollTop = node.scrollHeight;
    }, [messages]);
    
    return (
        <div
            className="chat"
            data-testid="chat"
        >
            <div
                className="chat__thread"
                ref={thread}
            >
                {messages.map((message) => (
                    <div
                        className="chat__message"
                        key={message.id}
                    >
                        <div className="message message--user">
                            {getSourceHeader(message.text) === '/source' && getSourceBody(message.text)
                                ? <>
                                    {getSourceHeader(message.text)}
                                    <SourceBlock data={getSourceBody(message.text)}/>
                                </>
                                : message.text}
                        </div>
                        <MessageRow message={message}/>
                    </div>
                ))}
            </div>
            <Input
                history={history}
                onSend={send}
            />
        </div>
    );
}
