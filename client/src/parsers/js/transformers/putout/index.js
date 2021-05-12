import compileModule from '../../../utils/compileModule';
import pkg from 'putout/package.json';

const ID = 'putout';
const displayName = 'putout';

const noop = () => {};

export default {
    id: ID,
    displayName,
    version: pkg.version,
    homepage: pkg.homepage,
    
    defaultParserID: 'babel',
    
    loadTransformer(callback) {
        require([
            'putout',
            '@putout/engine-parser/lib/parsers/acorn',
            '@putout/engine-parser/lib/parsers/babel',
            '@putout/engine-parser/lib/parsers/espree',
            '@putout/engine-parser/lib/parsers/esprima',
        ], (putout, acorn, babel, espree, esprima) => callback({
            putout,
            acorn,
            babel,
            espree,
            esprima,
        }));
    },
    
    transform({putout, acorn, babel, espree, esprima}, transformCode, source, parserName) {
        const parser = chooseParser(parserName, {
            acorn,
            babel,
            espree,
            esprima,
        });
        
        const plugin = compileModule(transformCode, {
            require: () => putout,
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
        return babel;
    }
}
