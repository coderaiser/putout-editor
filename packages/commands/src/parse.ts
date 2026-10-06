const isUndefined = (a: unknown): a is undefined => typeof a === 'undefined';

export type Flags = Record<string, string | boolean>;

export interface ParsedCommand {
    command: string;
    args: string;
    flags: Flags;
    
    /** What followed the body — a further command in the same input, if any. */
    rest?: string;
}

export interface ParseError {
    error: string;
}

const KNOWN_FLAGS = new Set([
    'full',
    'query',
]);

const unquote = (value: string) => {
    if (value.length < 2)
        return value;
    
    const [first] = value;
    
    if ((first !== '"' || value.at(-1) !== '"') && (first !== '\'' || value.at(-1) !== '\''))
        return value;
    
    return value.slice(1, -1);
};

const trim = (value: string) => value.trim();

/**
 * Splits the leading `--flag` and `--flag value` pairs off the head of the
 * argument. A `--flag` followed by another flag, or by nothing, is a boolean.
 * A flag that is not in `KNOWN_FLAGS` is dropped rather than reported: the
 * commands each declare their own flags, so an unrecognised one is a typo to
 * ignore, not a failure.
 */
function takeFlags(input: string): {
    flags: Flags;
    rest: string;
} {
    const flags: Flags = {};
    const rest: string[] = [];
    
    const parts = input
        .split(/\s+/)
        .filter(Boolean);
    
    for (let index = 0; index < parts.length; index++) {
        const part = parts[index];
        
        if (!part.startsWith('--')) {
            rest.push(part);
            
            continue;
        }
        
        const name = part.slice(2);
        
        if (!KNOWN_FLAGS.has(name))
            continue;
        
        const next = parts[index + 1];
        
        if (isUndefined(next) || next.startsWith('--')) {
            flags[name] = true;
            
            continue;
        }
        
        flags[name] = unquote(next);
        index++;
    }
    
    return {
        flags,
        rest: trim(rest.join(' ')),
    };
}

/**
 * Whether a line of a body is a **new command** rather than more of the source.
 *
 * A line whose first word is not a command name cannot be one, so `source`
 * followed by `const a = 1;` keeps its `;` and `source` followed by
 * `ast();` — first word `ast()` — does not have its body cut in half. That
 * second case is the one a bare `startsWith(name)` test gets wrong, and a
 * `source` body is exactly the place it would bite: a snippet of real code
 * calling something named after a command.
 *
 * The names come from the caller rather than from this module, because
 * `parse.ts` is below `commands/index.ts` and importing the registry back up
 * would be a cycle. `parseCommand` is called with the same map `useChat`
 * dispatches on, so "a command" means the same thing in both.
 */
const startsCommand = (line: string, names: Set<string>) => {
    const [first] = trim(line).split(/\s+/);
    
    return names.has(first);
};

/**
 * Everything after the first newline is the body — that is how `source` and
 * `find` take multi-line code. A body ends at the next line that begins a
 * command, so `source` followed by `ast` in one input does not swallow the
 * `ast`.
 */
function splitBody(input: string, names: Set<string>): {
    body: string;
    rest: string;
} {
    const lines = input.split('\n');
    
    for (const [index, line] of lines.entries()) {
        if (!index)
            continue;
        
        if (!startsCommand(line, names))
            continue;
        
        return {
            body: trim(
                lines
                    .slice(0, index)
                    .join('\n'),
            ),
            rest: trim(
                lines
                    .slice(index)
                    .join('\n'),
            ),
        };
    }
    
    return {
        body: trim(lines.join('\n')),
        rest: '',
    };
}

/**
 * The first word of the first line is the command. There is no slash: the
 * command **is** the first word, so `ast` and `ast` are different strings and
 * only the first names anything.
 *
 * The word is not checked against `names` here. The parser answers "what were
 * the parts", and an unrecognised first word is still a command-shaped answer
 * — it is the dispatcher that owns the vocabulary and the suggestion, so
 * `parseCommand('hello')` cannot know whether `hello` deserves "did you mean"
 * or a plain error.
 *
 * `names` is what a body is measured against, and it defaults to empty: a
 * caller with no registry has no commands, so nothing can end a body early.
 */
export function parseCommand(input: string, names: Iterable<string> = []): ParsedCommand | ParseError {
    const text = trim(input);
    
    if (!text)
        return {
            error: 'Empty command',
        };
    
    const newline = text.indexOf('\n');
    
    const head = newline === -1 ? text : text.slice(0, newline);
    
    const [name] = head.split(/\s+/);
    
    const inline = newline === -1 ? head.slice(name.length) : '';
    
    const {body, rest} = newline === -1 ? {
        body: '',
        rest: '',
    } : splitBody(text.slice(newline + 1), new Set(names));
    
    const {flags, rest: afterFlags} = takeFlags(inline);
    
    const args = unquote(trim(body || afterFlags));
    
    const result: ParsedCommand = {
        command: name,
        args,
        flags,
    };
    
    if (rest)
        result.rest = rest;
    
    return result;
}
