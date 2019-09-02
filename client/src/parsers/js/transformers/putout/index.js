import compileModule from '../../../utils/compileModule';
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
        require(
            ['putout/dist/putout.js'],
            (putout) => callback({ putout })
        );
    },
    
    transform({ putout }, transformCode, source, parser) {
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
