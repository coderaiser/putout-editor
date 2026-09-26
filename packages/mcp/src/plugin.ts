import {createRequire} from 'node:module';
import {tryCatch} from 'try-catch';
import {compileRule, type Rule} from 'redput/compile-rule';

export {type Rule} from 'redput/compile-rule';

const require = createRequire(import.meta.url);

type SyntaxErrorWithLoc = {
    loc?: {
        line: number;
        column: number;
    };
    message: string;
};

const formatLoc = (error: SyntaxErrorWithLoc) => {
    if (!error.loc)
        return '';
    
    return ` (line ${error.loc.line}, col ${error.loc.column})`;
};

export function compilePlugin(plugin: string): Rule {
    const [error, compiled] = tryCatch(compileRule, plugin, {
        require,
    });
    
    if (error)
        throw Error(`plugin_syntax${formatLoc(error as SyntaxErrorWithLoc)}: ${(error as SyntaxErrorWithLoc).message}`);
    
    return compiled;
}
