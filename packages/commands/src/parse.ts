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
 * Everything after the first newline is the body — that is how `/source` and
 * `/find` take multi-line code, per the C1 rule. A body ends at the next line
 * that starts a command, so `/source` followed by `/ast` in one input does not
 * swallow the `/ast`.
 */
function splitBody(input: string): {
    body: string;
    rest: string;
} {
    const lines = input.split('\n');
    
    for (const [index, line] of lines.entries()) {
        if (!index)
            continue;
        
        if (!trim(line).startsWith('/'))
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

export function parseCommand(input: string): ParsedCommand | ParseError {
    const text = trim(input);
    
    if (!text)
        return {
            error: 'Empty command',
        };
    
    const newline = text.indexOf('\n');
    
    const head = newline === -1 ? text : text.slice(0, newline);
    
    if (!head.startsWith('/'))
        return {
            error: `Not a command: ${head}`,
        };
    
    const [name] = head
        .slice(1)
        .split(/\s+/);
    
    if (!name)
        return {
            command: 'help',
            args: '',
            flags: {},
        };
    
    const inline = newline === -1 ? head.slice(1 + name.length) : '';
    
    const {body, rest} = newline === -1 ? {
        body: '',
        rest: '',
    } : splitBody(text.slice(newline + 1));
    
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
