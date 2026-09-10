import {createRequire} from 'node:module';
import {tryCatch} from 'try-catch';
import {compileRule} from 'redput/compile-rule';

export type PluginModule = {
    report: () => string;
    replace?: () => Record<string, string>;
    traverse?: () => Record<string, unknown>;
    include?: () => Record<string, unknown>;
};

const require = createRequire(import.meta.url);

export function compilePlugin(plugin: string) {
    const [error, compiled] = tryCatch(compileRule, plugin, {
        require,
    });
    
    if (error)
        throw Error(`plugin_syntax: ${error.message}`);
    
    return compiled as unknown as PluginModule;
}
