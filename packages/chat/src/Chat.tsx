import {
    useEffect,
    useRef,
} from 'react';
import {useChat} from './hooks/useChat.ts';
import Input from './Input.tsx';
import MessageRow from './Message.tsx';

/** The thread and the input. The console panel is `App`'s business, not this. */
export default function Chat() {
    const {
        send,
        messages,
        history,
    } = useChat();
    
    const thread = useRef<HTMLDivElement>(null);
    
    /**
     * Keep the newest message in view.
     *
     * Without this, sending is invisible: the thread is `overflow-y: auto` and
     * the answer lands below the fold, so a user who types `ast` and presses
     * Enter sees the page do nothing at all. Measured on the seeded thread —
     * `scrollTop` stayed `0` with 849px of content in a 568px box — and the
     * seed is what made it permanent rather than occasional, since an empty
     * thread fits its box and every answer used to be on screen for free.
     *
     * A `ref` on the scrolling element rather than `scrollIntoView()` on a
     * message: the latter needs a target to exist, and `find places` on the
     * answer would scroll to the echo instead of the reply.
     *
     * On **every** message change rather than only on send, which is what makes
     * the opening screen open at its end — a first-time visitor otherwise sees
     * the `source` echo and has to scroll to find out the tool answers.
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
                            {message.text}
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
