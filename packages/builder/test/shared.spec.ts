import {test} from 'supertape';
import {
    NODE_ONLY,
    createFallback,
    createIgnore,
    createMinimizer,
    createRemoveNodePrefix,
    createReplaceWithNothing,
    createSwcLoader,
} from '../lib/shared.js';

class Plugin {
    args: unknown[];
    constructor(...args: unknown[]) {
        this.args = args;
    }
}

const rspack = {
    IgnorePlugin: class IgnorePlugin extends Plugin {},
    NormalModuleReplacementPlugin: class NormalModuleReplacementPlugin extends Plugin {},
    SwcJsMinimizerRspackPlugin: class SwcJsMinimizerRspackPlugin extends Plugin {},
};

test('builder: shared: NODE_ONLY: has stylelint', (t) => {
    const result = NODE_ONLY.some((regexp) => regexp.test('stylelint'));
    
    t.ok(result);
    t.end();
});

test('builder: shared: createIgnore', (t) => {
    const ignore = createIgnore(rspack);
    const {args} = ignore(/globby/) as Plugin;
    const result = args;
    
    const expected = [{
        resourceRegExp: /globby/,
    }];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: shared: createReplaceWithNothing: request', (t) => {
    const replace = createReplaceWithNothing(rspack, '/shim.js');
    const {args} = replace('@putout/processor-css') as Plugin;
    const result = args;
    const expected = [/^@putout\/processor-css$/, '/shim.js'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: shared: createRemoveNodePrefix: cuts the prefix', (t) => {
    const {args} = createRemoveNodePrefix(rspack) as Plugin;
    
    const resource = {
        request: 'node:fs',
    };
    
    const [request, replace] = args as [RegExp, (resource: {
        request: string;
    }) => void];
    
    replace(resource);
    
    const result = [
        request.test('node:fs'),
        resource.request,
    ];
    
    const expected = [true, 'fs'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: shared: createMinimizer: keeps names', (t) => {
    const [{args}] = createMinimizer(rspack) as Plugin[];
    const [{minimizerOptions}] = args as [
        {
            minimizerOptions: {
                compress: {
                    keep_fnames: boolean;
                };
            };
        },
    ];
    
    t.ok(minimizerOptions.compress.keep_fnames);
    t.end();
});

test('builder: shared: createSwcLoader: development', (t) => {
    const {options} = createSwcLoader(true);
    const {development} = options.jsc.transform.react;
    
    t.ok(development);
    t.end();
});

test('builder: shared: createSwcLoader: production', (t) => {
    const {options} = createSwcLoader(false);
    const {development} = options.jsc.transform.react;
    
    t.notOk(development);
    t.end();
});

test('builder: shared: createFallback: resolves packages, cuts the rest', (t) => {
    const resolve = (name: string) => `/resolved/${name}`;
    const {path, fs} = createFallback(resolve);
    const result = [path, fs];
    
    const expected = [
        '/resolved/path-browserify',
        false,
    ];
    
    t.deepEqual(result, expected);
    t.end();
});
