import {useDispatch, useSelector} from 'react-redux';
import {commands} from '@putout/editor-commands';
import {
    lazy,
    Suspense,
    useState,
    type KeyboardEvent,
} from 'react';
import {setHistoryIndex} from '#store';
import type {RootState} from '#store/types';
import {prefixOf, SIGIL} from './sigil.ts';
import {useIsMobile} from './hooks/useIsMobile.ts';
import {composerKey, type ComposerAction} from './composerKeys.ts';

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
    
    const send = () => {
        if (!text.trim())
            return;
        
        onSend(text);
        setText('');
        dispatch(setHistoryIndex(-1));
        setPicked(0);
    };
    
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
    const complete = (value: string) => {
        setText(`${SIGIL}${prefixOf(value)} `);
        setPicked(0);
    };
    
    const coarse = useIsMobile();
    
    const run = (action: ComposerAction) => {
        if (action.kind === 'complete')
            complete(options[picked]);
        
        if (action.kind === 'send')
            send();
        
        if (action.kind === 'clear')
            onChange('');
        
        if (action.kind === 'pick')
            setPicked(action.index);
        
        if (action.kind === 'history')
            dispatch(setHistoryIndex(action.index));
    };
    
    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        const {action, prevent} = composerKey(event, {
            text,
            open,
            exact,
            coarse,
            picked,
            count: options.length,
            cursor,
            historyLength: history.length,
        });
        
        if (prevent)
            event.preventDefault();
        
        if (action)
            run(action);
    };
    
    // `cursor` is how far back in the history the user has walked, so 0 means
    // "showing the box as it is" and 1 is the most recent line. Reading it here
    // rather than in the key handler is what makes a single `↑` recall: the
    // handler bumps the number and this turns it into text on the same render.
    const recalled = cursor >= 0 ? history.at(!cursor ? history.length - 1 : history.length - cursor - 1) : undefined;
    const value = text || recalled || '';
    
    return (
        <div className="input">
            {open && (
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
