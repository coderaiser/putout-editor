/**
 * Parser-specific config object (babel options, acorn options, ...).
 * There is no shared schema across parsers — `null` is the "no settings" state.
 *
 * It lives here rather than in the store because the parser contract needs it,
 * and the store is downstream of the parser.
 */
export type ParserSettings = Record<string, unknown> | null;

// Character offset into source text (0-indexed, matches CM6 and Babel's start/end)
export type CharOffset = number;

// Line/column position — matches CodeMirror's {line, ch} convention
export type SourcePosition = {
    line: number;
    ch: number;
};

const isNumber = (a: unknown): a is number => !Number.isNaN(a) && typeof a === 'number';
const isFiniteNumber = (a: unknown): a is number => isNumber(a) && Number.isFinite(a);

/**
 * [start, end) offsets into source text. A plain, canonical tuple — not branded.
 * The safety property is enforced by the runtime choke point: only values that
 * pass through `parseSourceRange` (which reconstructs a fresh, canonical tuple)
 * may become editor state. No casts are needed and none are allowed.
 */
export type SourceRange = readonly [
    CharOffset,
    CharOffset,
];

export const isCharOffset = (value: unknown): value is CharOffset => isFiniteNumber(value) && value >= 0;

export const parseCharOffset = (value: unknown): CharOffset | null => isCharOffset(value) ? value : null;

export const parseSourceRange = (value: unknown): SourceRange | null => {
    if (!Array.isArray(value) || value.length < 2)
        return null;
    
    const start = parseCharOffset(value[0]);
    const end = parseCharOffset(value[1]);
    
    if (start === null || end === null)
        return null;
    
    // Reconstruct a fresh, canonical pair — never leak the original (possibly
    // overflowing or untrusted) array. Extra elements are dropped.
    return [start, end];
};

export const parseSourcePosition = (value: unknown): SourcePosition | null => {
    if (!value || typeof value !== 'object')
        return null;
    
    const {line, ch} = value as Record<string, unknown>;
    
    if (typeof line !== 'number' || typeof ch !== 'number')
        return null;
    
    return {
        line,
        ch,
    };
};

// Babel AST node — open interface, all parsers produce nodes with at least these fields
export interface AstNode {
    type: string;
    start?: CharOffset;
    end?: CharOffset;
    [key: string]: unknown;
}

// The result of parsing source code
export type ParseResult = {
    ast: AstNode;
    error: Error | null;
    time?: number;
    source?: string;
};

// Parser ID as used in store and URLs — e.g. 'babel', 'acorn', 'espree'
export type ParserID = string;

// Transformer ID — e.g. 'putout'
export type TransformerID = string;

// CodeMirror editor mode string — e.g. 'javascript', 'json'
export type EditorMode = string;

// CodeMirror key map name
export type KeyMap =
    | 'vim'
    | 'emacs'
    | 'sublime'
    | 'default';

// Editor theme name
export type EditorTheme = 'nord' | 'default';

// putout plugin source code (ESM string)
export type PluginSource = string;

// JavaScript/TypeScript source code
export type SourceCode = string;

// Content change event from Editor component
export type ContentChange = {
    value: SourceCode;
    cursor: CharOffset;
};

// Props shared by all editor panels (source, plugin, result)
export interface EditorProps {
    value: SourceCode;
    mode: EditorMode;
    keyMap: KeyMap;
    readOnly: boolean;
    lineNumbers: boolean;
    highlightRange: SourceRange | null;
    onContentChange: (change: ContentChange) => void;
    onActivity: (cursor: CharOffset) => void;
    onBlur: () => void;
}
