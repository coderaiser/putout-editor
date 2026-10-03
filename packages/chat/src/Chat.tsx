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
    
    return (
        <div
            className="chat"
            data-testid="chat"
        >
            <div className="chat__thread">
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
