import {tryCatch} from 'try-catch';
import {compileRule} from 'redput/compile-rule';

type Position = {
    line: number;
    column: number;
};

export type StructuredError = {
    kind: 'plugin_syntax' | 'fixture_syntax' | 'plugin_error';
    message: string;
    position?: Position;
};

type CompileRuleOptions = {
    require: NodeRequire;
};

function positionFromError(error: Error & {loc?: {line: number; column: number}}): Position | undefined {
    if (!error.loc)
        return undefined;

    return {
        line: error.loc.line,
        column: error.loc.column,
    };
}

export function compilePlugin(plugin: string, options: CompileRuleOptions): [Error & {structured?: StructuredError}, null] | [null, ReturnType<typeof compileRule>] {
    const [error, compiled] = tryCatch(compileRule, plugin, options);

    if (!error)
        return [null, compiled];

    const structured: StructuredError = {
        kind: 'plugin_syntax',
        message: error.message,
        position: positionFromError(error),
    };

    const wrappedError = Object.assign(new Error(error.message), {structured});

    return [wrappedError, null];
}

export function structuredFromPutoutError(error: Error & {loc?: {line: number; column: number}}): StructuredError {
    if (error.constructor.name === 'SyntaxError')
        return {
            kind: 'fixture_syntax',
            message: error.message,
            position: positionFromError(error),
        };

    return {
        kind: 'plugin_error',
        message: error.message,
    };
}