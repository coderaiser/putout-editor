import {useDispatch, useSelector} from 'react-redux';
import {commands} from '@putout/editor-commands';
import {
    useCallback,
    useState,
    type ChangeEvent,
    type KeyboardEvent,
} from 'react';
import {setHistoryIndex} from '#store';
import type {RootState} from '#store/types';

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

/**
 * The description shown beside a `/name` in the dropdown, or nothing.
 *
 * Exported for one reason: the `''` arm is unreachable from the component,
 * because every row in the dropdown comes from `commands` and so always has an
 * entry. Without a spec of its own that arm is a branch nothing reaches, which
 * is what the 100% gate is for — and the honest test is the function, not a
 * dropdown that cannot show the case.
 */
export const describeOf = (option: string): string => {
    const command = commands.get(option.slice(1));
    
    return command ? command.description : '';
};

export default function Input({history, onSend}: InputProps) {
    const dispatch = useDispatch();
    const cursor = useSelector((root: RootState) => root.chat.historyIndex);
    const [text, setText] = useState('');
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
        dispatch(setHistoryIndex(-1));
        setPicked(0);
    }, [dispatch, onSend, text]);
    
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
        
        // `cursor` counts how far back the user has walked: 0 is the newest
        // entry, 1 the one before it. Starting at 0 rather than 1 is what makes
        // the first `↑` land on the most recent line instead of doing nothing.
        if (key === 'ArrowUp' && !open && !text) {
            dispatch(setHistoryIndex(Math.min(cursor + 1, history.length)));
            
            return;
        }
        
        if (key === 'ArrowDown' && !open && !text) {
            dispatch(setHistoryIndex(Math.max(cursor - 1, -1)));
            
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
    
    // `cursor` is how far back in the history the user has walked, so 0 means
    // "showing the box as it is" and 1 is the most recent line. Reading it here
    // rather than in the key handler is what makes a single `↑` recall: the
    // handler bumps the number and this turns it into text on the same render.
    const recalled = cursor >= 0 ? history.at(!cursor ? history.length - 1 : history.length - cursor - 1) : undefined;
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
