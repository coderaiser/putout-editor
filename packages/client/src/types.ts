// Character offset into source text (0-indexed, matches CM6 and Babel's start/end)
export type CharOffset = number;

// Line/column position — matches CodeMirror's {line, ch} convention
export type SourcePosition = {
    line: number;
    ch: number;
};

// Range of characters in source text: [start, end] inclusive-exclusive
export type SourceRange = [
    CharOffset,
    CharOffset,
];

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
