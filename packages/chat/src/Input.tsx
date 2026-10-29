import {useDispatch, useSelector} from 'react-redux';
import {commands} from '@putout/editor-commands';
import {
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useState,
    type KeyboardEvent,
} from 'react';
import {setHistoryIndex} from '#store';
import type {RootState} from '#store/types';
import {prefixOf, SIGIL} from './sigil.ts';
import {isCoarsePointer} from './hooks/useIsMobile.ts';

/**
 * CodeMirror is ~3.4 MiB and the composer is the only thing that needs it,
 * so it is a separate async chunk rather than part of the initial payload.
 * `rspack.config.js` routes `qword`/`@codemirror`/`@lezer` into a
 * `chunks: 'async'` group, and `lazy` is what makes the import dynamic
 * enough for that to apply. Until it resolves the fallback holds the
 * composer's resting height, so the box does not collapse and jump.
 */
const CodeMirrorBox = lazy(() => import('./CodeMirrorBox.tsx'));

export interface InputProps {
    history: string[];
    onSend: (input: string) => void;
}

/**
 * Size the box to its content, up to `max-height`. Show the scrollbar only
 * at the cap: CSS cannot do that. jsdom reports 0 for both values, so this
 * has its own spec.
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
 * Commands whose name starts with the typed text, in registry order. The
 * sigil is skipped: `/` alone matches all. The names keep the sigil.
 * An empty prefix matches all. A space closes the list.
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
 * The description of a command, or `''`. Exported so a spec reaches the
 * `''` arm. The caller strips the sigil: `describeOf(prefixOf(option))`.
 */
export const describeOf = (option: string): string => {
    const command = commands.get(option);
    
    return command ? command.description : '';
};

/**
 * Commands with a body get a gutter. Only the first word counts, read with
 * `prefixOf`: `/source const a = 1` is `true`.
 */
const BODY_COMMANDS = new Set([
    'source',
    'find',
    'transform',
    'validate',
    'flow',
]);

export const wantsLineNumbers = (typed: string): boolean => {
    const prefix = prefixOf(typed);
    const [name] = prefix.split(/\s+/);
    
    return BODY_COMMANDS.has(name);
};

/**
 * Does a plain `Enter` send? Touch (`pointer: coarse`): newline. Desktop:
 * send. `Shift+Enter` is a newline and `Ctrl`/`Cmd+Enter` sends on both.
 * A touch keyboard has only one return key, so there it makes a newline.
 */
export const enterSends = (coarse: boolean): boolean => !coarse;

/**
 * The pointer type, read once on mount. `false` when `matchMedia` is
 * missing. `Input.spec.tsx` imports it from here.
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
     * Only a full name with the slash (`/ast`) is exact and sends. A bare
     * `ast` goes to the completion branch and becomes `/ast `.
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
    
    const onChange = (next: string) => {
        setText(next);
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
        
        /*
         * `Enter` sends on a keyboard, `Ctrl`/`Cmd+Enter` sends everywhere.
         * `Shift+Enter` is the newline. `preventDefault` stops a second newline.
         */
        if (key === 'Enter' && !shiftKey && (ctrlKey || metaKey || enterSends(coarse))) {
            event.preventDefault();
            send();
            
            return;
        }
        
        // Plain `Enter` deliberately reaches no branch below on a keyboard: the
        // editor inserts the newline itself and fires the change that
        // `onChange` already turns into state. Re-implementing that here would
        // be a second place that has to know where the caret is, for a result
        // the editor hands over correctly.
        if (key === 'Tab' && open && options.length) {
            // Suppressed so CodeMirror does not also indent the line: the
            // completion replaces the whole box content on the next render,
            // and an indent inserted underneath would win the state race.
            event.preventDefault();
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
    
    // No `growTo`, no box ref: CodeMirror sizes its own content and the
    // `.input__box` CSS `min-height`/`max-height` bounds it. The `growTo`
    // export and its specs stay (a tested helper), only the call site goes.
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
            <Suspense
                fallback={<div
                    className="input__box input__box--loading"
                    data-testid="input"
                />}
            >
                <CodeMirrorBox
                    className="input__box"
                    data-testid="input"
                    lineNumbers={wantsLineNumbers(value)}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    placeholder="/help — list every command"
                    value={value}
                />
            </Suspense>
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
