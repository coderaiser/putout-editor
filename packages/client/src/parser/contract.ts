import type {CharOffset, SourcePosition} from '../types.ts';

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
