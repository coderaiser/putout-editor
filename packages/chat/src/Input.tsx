import {commands} from '@putout/editor-commands';
import {
    useCallback,
    useState,
    type ChangeEvent,
    type KeyboardEvent,
} from 'react';

export interface InputProps {
    history: string[];
    onSend: (input: string) => void;
}

const MAX_LINES = 6;

/** Commands whose name starts with what has been typed, `/` included. */
export const matches = (typed: string): string[] => {
    if (!typed.startsWith('/'))
        return [];
    
    const names = [...commands.keys()];
    const result: string[] = [];
    
    for (const name of names)
        if (name.startsWith(typed.slice(1)))
            result.push(`/${name}`);
    
    return result;
};

/** The description shown beside a `/name` in the dropdown, or nothing. */
const describeOf = (option: string): string => {
    const command = commands.get(option.slice(1));
    
    return command ? command.description : '';
};

export default function Input({history, onSend}: InputProps) {
    const [text, setText] = useState('');
    const [cursor, setCursor] = useState(0);
    const [picked, setPicked] = useState(0);
    
    const open = text.startsWith('/');
    const options = open ? matches(text) : [];
    
    /**
     * Whether the box already holds a command in full. `Enter` completes a
     * *partial* name and sends a *whole* one, so typing `/ast` and pressing
     * Enter runs `/ast` rather than turning it into `/ast ` and waiting for a
     * second Enter — a dropdown that is still showing one row the user already
     * typed in full should not capture the send key.
     */
    const exact = options.includes(text);
    
    const send = useCallback(() => {
        if (!text.trim())
            return;
        
        onSend(text);
        setText('');
        setCursor(0);
        setPicked(0);
    }, [onSend, text]);
    
    const onChange = ({target}: ChangeEvent<HTMLTextAreaElement>) => {
        setText(target.value);
        setPicked(0);
    };
    
    const complete = useCallback((value: string) => {
        setText(`${value} `);
        setPicked(0);
    }, []);
    
    const onKeyDown = useCallback(({key, shiftKey}: KeyboardEvent<HTMLTextAreaElement>) => {
        if (key === 'Enter' && !shiftKey) {
            if (open && options.length && !exact) {
                complete(options[picked]);
                return;
            }
            
            send();
            
            return;
        }
        
        if (key === 'Tab' && open && options.length) {
            complete(options[picked]);
            
            return;
        }
        
        if (key === 'Escape') {
            setText('');
            setPicked(0);
            
            return;
        }
        
        if (key === 'ArrowDown' && open && options.length) {
            setPicked((index) => (index + 1) % options.length);
            
            return;
        }
        
        if (key === 'ArrowUp' && open && options.length) {
            setPicked((index) => (index - 1 + options.length) % options.length);
            
            return;
        }
        
        if (key === 'ArrowUp' && !open && !text) {
            setCursor((at) => Math.max(at - 1, 0));
            
            return;
        }
        
        if (key === 'ArrowDown' && !open && !text) {
            setCursor((at) => Math.min(at + 1, history.length));
            
            return;
        }
    }, [
        complete,
        exact,
        history.length,
        open,
        options,
        picked,
        send,
        text,
    ]);
    
    // `↑` on an empty box recalls, so the recalled line is read from `history`
    // here rather than in the key handler: a handler that set both would need
    // the recalled value immediately, before React re-renders.
    const recalled = cursor > 0 ? history.at(-cursor) : undefined;
    const value = text || recalled || '';
    
    return (
        <div className="input">
            {open && options.length > 0 && (
                <div
                    className="autocomplete"
                    data-testid="autocomplete"
                >
                    {options.map((option, index) => (
                        <div
                            className={[
                                'autocomplete__row',
                                index === picked && 'autocomplete__row--picked',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            key={option}
                            onMouseDown={(event) => {
                                event.preventDefault();
                                complete(option);
                            }}
                        >
                            {option}
                            <span className="autocomplete__description">
                                {describeOf(option)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            <textarea
                className="input__box"
                data-testid="input"
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder="Message or /command…"
                rows={MAX_LINES}
                value={value}
            />
            <button
                className="input__send"
                data-testid="send"
                onClick={send}
                type="button"
            >
                {'Send'}
            </button>
        </div>
    );
}
