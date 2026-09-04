import type {CharOffset, SourcePosition} from '../types.ts';

declare const RangeBrand: unique symbol;

// [start, end) offsets into source text. Branded: a plain [number, number]
// (or worse, [object, object] from a parser) cannot flow into typed call sites.
export type SourceRange = readonly [CharOffset, CharOffset] & {
    [RangeBrand]: 'SourceRange';
};

export const isCharOffset = (value: unknown): value is CharOffset =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0;

export const parseCharOffset = (value: unknown): CharOffset | null =>
    isCharOffset(value) ? value : null;

export const parseSourceRange = (value: unknown): SourceRange | null => {
    if (!Array.isArray(value) || value.length !== 2)
        return null;
    
    if (!isCharOffset(value[0]) || !isCharOffset(value[1]))
        return null;
    
    // The single cast in the codebase — guarded by the checks above.
    return value as unknown as SourceRange;
};

export const parseSourcePosition = (value: unknown): SourcePosition | null => {
    if (!value || typeof value !== 'object')
        return null;
    
    const {line, ch} = value as Record<string, unknown>;
    
    if (typeof line !== 'number' || typeof ch !== 'number')
        return null;
    
    return {line, ch};
};