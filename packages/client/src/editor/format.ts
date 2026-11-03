import {type Node} from '@putout/babel';
import {type ParserPlugin} from '@babel/parser';
import {tryCatch} from 'try-catch';
import {normalizeRule} from './normalizeRule.ts';

export class Skip extends Error {}type FormatResult = [Error | null, string?];

export const formatInput = async (source: string, ast: Node): Promise<FormatResult> => {
    if (!ast)
        return [
            new Skip('No AST'),
        ];
    
    const {print} = await import('@putout/printer');
    
    const [printError, formatted] = tryCatch(print, ast);
    
    if (printError)
        return [printError];
    
    if (formatted === source)
        return [
            new Skip('No changes'),
        ];
    
    return [null, formatted];
};

export const formatRule = async (source: string): Promise<FormatResult> => {
    if (!source)
        return [
            new Skip('No source'),
        ];
    
    const {parse} = await import('@babel/parser');
    const {default: plugins} = await import('@putout/engine-parser/babel/plugins');
    
    const [error, ast] = tryCatch(parse, source, {
        sourceType: 'module',
        plugins: (plugins as ParserPlugin[]),
    });
    
    if (error)
        return [new Skip(error.message)];
    
    const {print} = await import('@putout/printer');
    const [printError, formatted] = tryCatch(print, ast);
    
    if (printError)
        return [printError];
    
    const normalized = normalizeRule(formatted);
    
    return [null, normalized];
};
