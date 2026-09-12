import pkg from 'putout/package.json' with {
    type: 'json',
};
import {initPlugin} from './init-plugin.ts';

const ID = 'putout';
const displayName = '🐊Putout';

export default {
    id: ID,
    displayName,
    version: pkg.version,
    homepage: pkg.homepage,
    
    defaultParserID: 'babel',
    
    loadTransformer(callback: (value: any) => void) {
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
    
    transform({putout, acorn, babel, espree, esprima}: any, transformCode: string, source: string, parserName: string) {
        const parser = chooseParser(parserName, {
            acorn,
            babel,
            espree,
            esprima,
        });
        
        const plugin = initPlugin(transformCode);
        
        const {code} = putout(source, {
            parser,
            cache: false,
            isJSX: true,
            isTS: true,
            fixCount: 1,
            plugins: [{
                plugin,
            }],
        });
        
        return code;
    },
};

function chooseParser(parserName: string, {acorn, babel, espree, esprima}: any) {
    if (parserName === 'acorn')
        return acorn;
    
    if (parserName === 'espree')
        return espree;
    
    if (parserName === 'esprima')
        return esprima;
    
    return {
        parse: (source: string, options: any) => {
            return babel.parse(source, {
                ...options,
                isRecovery: true,
            });
        },
    };
}
