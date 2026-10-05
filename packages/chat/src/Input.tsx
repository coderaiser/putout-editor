import {useDispatch, useSelector} from 'react-redux';
import {commands} from '@putout/editor-commands';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type KeyboardEvent,
} from 'react';
import {setHistoryIndex} from '#store';
import type {RootState} from '#store/types';
import {prefixOf, SIGIL} from './sigil.ts';
import {isCoarsePointer} from './hooks/useIsMobile.ts';

export interface InputProps {
    history: string[];
    onSend: (input: string) => void;
}

/**
 * Size the box to its content, up to whatever `max-height` allows.
 *
 * Written as a standalone export with its own spec because it is the only part
 * of this component that cannot be checked by rendering: it reads `scrollHeight`
 * and writes `style.height`, and jsdom reports both as 0.
 *
 * The scrollbar is set here rather than in `chat.css` because CSS cannot
 * express it: `overflow-y` has no "only once you hit the cap" mode, and the
 * cap is the thing being measured here. So the stylesheet starts at `hidden`
 * and this turns it on exactly when the content is taller than the cap.
 */
export const growTo = (box: HTMLTextAreaElement | null): void => {
    if (!box)
        return;
    
    box.style.height = 'auto';
    box.style.height = `${box.scrollHeight}px`;
    
    // Read the cap from the computed style rather than repeating `200` here,
    
    // so the two cannot drift apart the way a hard-coded number would.
    const cap = parseInt(getComputedStyle(box).maxHeight, 10);
    
    box.style.overflowY = box.scrollHeight > cap ? 'auto' : 'hidden';
};

/**
 * Commands whose name starts with what has been typed, in registry order.
 *
 * The sigil is skipped for matching, so `/as` offers what `as` offers: `/`
 * alone is a prefix of every command and opens the whole list, which is what
 * makes it usable as a menu key. The returned names carry the sigil, so the
 * dropdown teaches lines the page runs — matching is forgiving, display is not.
 *
 * An **empty** prefix matches every command, which is what makes the list
 * reachable at all; the component gates on a non-empty box so an idle composer
 * stays quiet. A space closes it, because a space ends the command word and
 * whatever follows is an argument.
 */
export const matches = (typed: string): string[] => {
    const prefix = prefixOf(typed);
    
    if (/\s/.test(prefix))
        return [];
    
    const result: string[] = [];
    
    for (const name of commands.keys())
        if (name.startsWith(prefix))
            result.push(`${SIGIL}${name}`);
    
    return result;
};

/**
 * The description shown beside a name in the dropdown, or nothing.
 *
 * Exported for one reason: the `''` arm is unreachable from the component,
 * because every row in the dropdown comes from `commands` and so always has an
 * entry. Without a spec of its own that arm is a branch nothing reaches, which
 * is what the 100% gate is for — and the honest test is the function, not a
 * dropdown that cannot show the case.
 *
 * The option is the slashed suggestion, so the sigil is stripped at the call
 * site (`describeOf(prefixOf(option))`) — a direct `commands.get(option)` on
 * `/ast` is `undefined`, and every row would render the `''` arm instead.
 */
export const describeOf = (option: string): string => {
    const command = commands.get(option);
    
    return command ? command.description : '';
};

/**
 * Whether a plain `Enter` sends, given the pointer type.
 *
 * `(pointer: coarse)` is the *intent* test, not a width one: a narrow desktop
 * window still has a keyboard, and a tablet in a dock has a pointer. So:
 *
 * | Key | Touch | Desktop |
 * |---|---|---|
 * | `Enter` | newline | **send** |
 * | `Shift+Enter` | newline | newline |
 * | `Ctrl`/`Cmd+Enter` | send | send |
 *
 * This reverses `69f5634`, which made `Enter` a newline everywhere because
 * `source` takes a body and one keystroke cannot finish a line. That reason
 * holds on a keyboard — it is why `Shift+Enter` survives here — and inverts on a
 * touchscreen, where the virtual keyboard's own return key is the only newline
 * available and a chat where return cannot send is a chat with no send key but
 * the button.
 *
 * A function rather than a module-level constant so a spec can state which case
 * it is exercising. happy-dom *does* implement `matchMedia` and answers `false`
 * for `(pointer: coarse)`, so the default in a spec is the desktop case without
 * saying so — which is why the touch case below installs its own stub.
 */
export const enterSends = (coarse: boolean): boolean => !coarse;

/**
 * Reads the pointer type once, at mount, rather than per keystroke: a
 * `matchMedia` call inside the key handler would run on every keypress, and the
 * answer does not change while the page is up unless the device is re-plugged.
 *
 * `false` where `matchMedia` is missing, which is the keyboard binding and the
 * safe default: a browser without the query still has a keyboard.
 *
 * **Re-exported**, not re-declared. The question is now asked in two places —
 * here for the key binding, and in `useIsMobile` for the layout — and two
 * copies of `(pointer: coarse)` is one more thing to keep in step. `Input` keeps
 * exporting it because `Input.spec.tsx` imports it from here, and moving an
 * import in a package whose only consumer is its own spec is churn, not
 * clarity.
 */
export {isCoarsePointer} from './hooks/useIsMobile.ts';

export default function Input({history, onSend}: InputProps) {
    const dispatch = useDispatch();
    const cursor = useSelector((root: RootState) => root.chat.historyIndex);
    const [text, setText] = useState('');
    const [picked, setPicked] = useState(0);
    
    // Open on a non-empty box, not on a sigil. `matches` answers every command
    // for an empty prefix — that is what keeps the list reachable through the
    // function — so the "the user has actually typed something" half of the
    // decision lives here, and an idle composer shows no dropdown.
    // `open` is a flag, never a count: every use below is a guard (`open && …`),
    // so `text !== ''` is the honest test rather than a truthiness one — a rule
    // that wants a boolean here is right that `length > 0` says nothing extra to
    // a `&&` whose left side is already a boolean.
    const options = matches(text);
    const open = text !== '' && options.length > 0;
    
    /**
     * Whether the box already holds a command in full. A dropdown showing one
     * row the user has already typed in full is not a choice left to make, so
     * `Enter` is not a *completion* here — which is what lets the send
     * shortcut below stay a plain "Enter means newline" rule.
     *
     * Compared directly against `options`, which holds `/ast`: only a slashed
     * full name is exact and sends. A bare `ast` is deliberately *not* exact —
     * normalizing it here would send `ast`, a line the page answers "Not a
     * command"; instead it falls into the completion branch above and becomes
     * `/ast `, a line the page runs.
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
    
    /**
     * Put the finished name in the box, with its slash.
     *
     * The sigil is forced rather than echoed: the option already carries one,
     * and `prefixOf` strips it before `SIGIL` is put back — so `tra`+Tab and
     * `/tra`+Tab both give `/transform `, a line the page runs, and never
     * `//transform `.
     */
    const complete = useCallback((value: string) => {
        setText(`${SIGIL}${prefixOf(value)} `);
        setPicked(0);
    }, []);
    
    /**
 * Read once at mount and kept in state, so the key handler reads one boolean
 * rather than calling `matchMedia` per keystroke. The listener below is the
 * stated limitation: a page left open across a device change (a tablet undocked
 * into a keyboard) keeps the binding it mounted with, and re-mounting on the
 * query would throw away the composer mid-sentence. That is a better trade than
 * the alternative for a chat box.
 */
    const [coarse, setCoarse] = useState(isCoarsePointer);
    
    useEffect(() => {
        if (typeof globalThis.matchMedia !== 'function')
            return;
        
        const query = globalThis.matchMedia('(pointer: coarse)');
        
        const onChange = () => {
            setCoarse(query.matches);
        };
        
        query.addEventListener('change', onChange);
        
        return () => {
            query.removeEventListener('change', onChange);
        };
    }, []);
    
    const onKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
        const {
            key,
            shiftKey,
            ctrlKey,
            metaKey,
        } = event;
        
        // Enter still completes a *partial* name while the dropdown is up, and
        // takes precedence over both the newline and the send: it is a choice
        // about the text, not about sending it. Also suppressed here — the
        // browser's newline would land after the completed name.
        //
        // `!shiftKey` keeps `Shift+Enter` a newline in every state, which is
        // what it was when it was the only way to get one, and on a touchscreen
        // where `Enter` sends it is the *only* way to get one.
        if (key === 'Enter' && !shiftKey && !ctrlKey && !metaKey && open && options.length && !exact) {
            event.preventDefault();
            complete(options[picked]);
            
            return;
        }
        
        // Send is `Enter` on a keyboard, `Ctrl`/`Cmd+Enter` everywhere, and never
        // `Shift+Enter` — which is the newline on both, and on a touchscreen is
        // the *only* way to get one, since a virtual keyboard has no chord.
        //
        // `!shiftKey` is the whole of that last claim, so it is here rather than
        // in `enterSends`: `enterSends` answers which device this is, and the
        // modifier is a fact about the keypress.
        //
        // The `preventDefault` matters: without it the browser also puts a
        // newline in the box on its way past.
        if (key === 'Enter' && !shiftKey && (ctrlKey || metaKey || enterSends(coarse))) {
            event.preventDefault();
            send();
            
            return;
        }
        
        // Plain `Enter` deliberately reaches no branch below on a keyboard: a
        // `textarea` inserts the newline itself and fires the `input` event that
        // `onChange` already turns into state. Re-implementing that here would
        // be a second place that has to know where the caret is, for a result
        // the browser hands over correctly.
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
        coarse,
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
    const box = useRef<HTMLTextAreaElement>(null);
    
    // `value` rather than `text`, because a recalled line is a multi-line
    // command arriving without a keystroke — resizing on `text` would leave the
    // box one row tall showing five lines of recalled source.
    useEffect(() => {
        growTo(box.current);
    }, [value]);
    
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
                                {describeOf(prefixOf(option))}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            <textarea
                /*
                 * iOS Safari rewrites this field without being asked: it
                 * capitalises the first character and autocorrects the rest, so
                 * `/ast` arrives as `/Ast` and `parseCommand` answers "Unknown
                 * command". This box takes command names, not prose, so all three
                 * opt-outs are on. `spellCheck` also stops the red squiggle under
                 * every plugin name in a pasted `source` body.
                 *
                 * React spells these in camelCase and the DOM stores them
                 * lowercase, which is why the spec reads them with
                 * `getAttribute('autocapitalize')` — the camelCase spelling returns
                 * `null` and the assertion would pass on a bare textarea.
                 */
                autoCapitalize="none"
                autoCorrect="off"
                className="input__box"
                data-testid="input"
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder="help — list every command"
                ref={box}
                spellCheck={false}
                value={value}
            />
            <button
                className="input__send"
                data-testid="send"
                onClick={send}
                title="Send (Ctrl+Enter)"
                type="button"
            >
                {'↑'}
            </button>
        </div>
    );
}
