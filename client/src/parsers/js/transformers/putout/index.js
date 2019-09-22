import compileModule from '../../../utils/compileModule';
import template from '@babel/template';
import pkg from 'putout/package.json';

const ID = 'putout';
const name = 'putout';

export default {
    id: ID,
    displayName: name,
    version: pkg.version,
    homepage: pkg.homepage,

    defaultParserID: 'babel',

    loadTransformer(callback) {
        require([
            'putout/slim/putout.js',
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

        putout.template = template;

        const plugin = compileModule(transformCode, {
            require: () => putout,
        });

        const { code } = putout(source, {
            parser,
            cache: false,
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
