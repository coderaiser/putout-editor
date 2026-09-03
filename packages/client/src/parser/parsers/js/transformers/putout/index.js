import path from 'node:path';
import pkg from 'putout/package.json' with {
    type: 'json',
};
import {compileRule} from 'redput/compile-rule';

const ID = 'putout';
const displayName = '🐊Putout';

const noop = () => {};

export default {
    id: ID,
    displayName,
    version: pkg.version,
    homepage: pkg.homepage,
    
    defaultParserID: 'babel',
    
    loadTransformer(callback) {
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
    
    transform({putout, acorn, babel, espree, esprima}, transformCode, source, parserName) {
        const parser = chooseParser(parserName, {
            acorn,
            babel,
            espree,
            esprima,
        });
        
        const plugin = compileRule(transformCode, {
            require: (name) => {
                if (name === 'path' || name === 'node:path')
                    return path;
                
                return putout;
            },
        });
        
        plugin.report = plugin.report || noop;
        
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

function chooseParser(parserName, {acorn, babel, espree, esprima}) {
    switch(parserName) {
    case 'acorn':
        return acorn;
    
    case 'espree':
        return espree;
    
    case 'esprima':
        return esprima;
    
    default:
        return {
            parse: (source, options) => {
                return babel.parse(source, {
                    ...options,
                    isRecovery: true,
                });
            },
        };
    }
}
