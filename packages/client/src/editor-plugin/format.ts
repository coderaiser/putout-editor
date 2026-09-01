import {type Node} from '@putout/babel';
import {tryCatch} from 'try-catch';
import {normalizeRule} from './normalizeRule.ts';

export const formatInput = async (source: string, ast: Node) => {
    if (!ast)
        return [
            Error('No AST'),
        ];
    
    const {print} = await import('@putout/printer');
    
    const formatted = print(ast);
    
    if (formatted === source)
        return [
            Error('No changes'),
        ];
    
    return [null, formatted];
};

export const formatRule = async (source: string) => {
    if (!source)
        return [
            Error('No source'),
        ];
    
    const {parse} = await import('@babel/parser');
    const {default: plugins} = await import('@putout/engine-parser/babel/plugins');
    
    const [error, ast] = tryCatch(parse, source, {
        sourceType: 'module',
        plugins,
    });
    
    if (error)
        return [error];
    
    const {print} = await import('@putout/printer');
    const formatted = print(ast);
    
    const normalized = normalizeRule(formatted);
    
    return [null, normalized];
};
