import {createRequire} from 'node:module';
import {tryCatch} from 'try-catch';
import {type Rule, compileRule} from 'redput/compile-rule';

export type {Rule};

const require = createRequire(import.meta.url);

export function compilePlugin(plugin: string): Rule {
    const [error, compiled] = tryCatch(compileRule, plugin, {
        require,
    });

    if (error)
        throw Error(`plugin_syntax: ${error.message}`);

    return compiled;
}
