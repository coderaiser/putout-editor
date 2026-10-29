import {parse, type ParserOptions} from '@babel/parser';
import {tryCatch} from 'try-catch';

const JS: ParserOptions = {
    sourceType: 'module',
    plugins: ['jsx'],
};

const TS: ParserOptions = {
    sourceType: 'module',
    plugins: ['typescript'],
};

const isBoolean = (a: unknown): a is boolean => typeof a === 'boolean';
const parses = (source: string, options: ParserOptions) => !tryCatch(parse, source, options)[0];

/**
 * TypeScript when the source does not parse as JavaScript (with JSX) and does
 * parse as TypeScript. Without `isTS`, putout reads `v as boolean` as three
 * statements and prints them, with no error.
 */
export const isTypeScript = (source: string): boolean => !parses(source, JS) && parses(source, TS);

/** The `isTS` the caller gave, or the one the source shows. */
export const resolveTS = (source: string, isTS?: boolean): boolean => {
    if (isBoolean(isTS))
        return isTS;
    
    return isTypeScript(source);
};
