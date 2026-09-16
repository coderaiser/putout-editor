import pkg from 'putout/package.json' with {
    type: 'json',
};
import {initPlugin} from './init-plugin.ts';

const ID = 'putout';
const displayName = '🐊Putout';

interface ParserSet {
    acorn: unknown;
    babel: unknown;
    espree: unknown;
    esprima: unknown;
}

interface Transformer {
    putout: (source: string, options: Record<string, unknown>) => {
        code: string;
    };
    acorn: unknown;
    babel: unknown;
    espree: unknown;
    esprima: unknown;
}

export default {
    id: ID,
    displayName,
    version: pkg.version,
    homepage: pkg.homepage,
    
    defaultParserID: 'babel',
    
    loadTransformer(callback: (value: Transformer) => void) {
        Promise
            .all([
                import('putout'),
                import('@putout/engine-parser/acorn'),
                import('@putout/engine-parser/babel'),
                import('@putout/engine-parser/espree'),
                import('@putout/engine-parser/esprima'),
            ])
            .then(([
                putoutMod,
                acornMod,
                babelMod,
                espreeMod,
                esprimaMod,
            ]) => callback({
                putout: putoutMod.putout,
                acorn: acornMod,
                babel: babelMod,
                espree: espreeMod,
                esprima: esprimaMod,
            }));
    },
    
    transform({putout, acorn, babel, espree, esprima}: Transformer, transformCode: string, source: string, parserName: string) {
        const parser = chooseParser(parserName, {
            acorn,
            babel,
            espree,
            esprima,
        });
        
        const plugin = initPlugin(transformCode);
        
        const {code} = putout(source, {
            parser,
            isJSX: true,
            isTS: true,
            fixCount: 1,
            plugins: [
                ['transform', plugin],
            ],
        });
        
        return code;
    },
};

function chooseParser(parserName: string, {acorn, babel, espree, esprima}: ParserSet) {
    if (parserName === 'acorn')
        return acorn;
    
    if (parserName === 'espree')
        return espree;
    
    if (parserName === 'esprima')
        return esprima;
    
    return {
        parse: (source: string, options: Record<string, unknown>) => {
            return (babel as {
                parse: (source: string, options: Record<string, unknown>) => unknown;
            }).parse(source, {
                ...options,
                isRecovery: true,
            });
        },
    };
}
