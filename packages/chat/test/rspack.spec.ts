import {test} from 'supertape';
import config from '../rspack.config.js';
import pkg from '../package.json' with {
    type: 'json',
};

type Plugin = {
    name: string;
    _args: [
        {
            resourceRegExp: RegExp;
        },
    ];
};

const isIgnorePlugin = (plugin: Plugin) => plugin.name === 'IgnorePlugin';
const getRegExp = ({_args}: Plugin) => _args[0].resourceRegExp;

const ignored = (config.plugins as Plugin[])
    .filter(isIgnorePlugin)
    .map(getRegExp);

const isIgnored = (name: string) => ignored.some((regExp) => regExp.test(name));

test('chat: rspack: hermes-parser is not in the bundle', (t) => {
    const result = isIgnored('hermes-parser');
    
    t.ok(result);
    t.end();
});

test('chat: rspack: node-only packages are not in the bundle', (t) => {
    const names = [
        'globby',
        'import-meta-resolve',
        'unicorn-magic',
        'stylelint',
        'supports-hyperlinks',
        '@putout/bundler',
        'env-paths',
        'cosmiconfig',
    ];
    
    const result = names.filter(isIgnored);
    
    t.deepEqual(result, names);
    t.end();
});

type Resolve = {
    fallback: Record<string, string | false>;
};
type Manifest = {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
};

const getPackageName = (path: string) => {
    const [first, second] = path
        .split('node_modules/')
        .at(-1)!.split('/');
    
    if (first.startsWith('@'))
        return `${first}/${second}`;
    
    return first;
};

const isString = (value: string | false): value is string => typeof value === 'string';

test('chat: rspack: each fallback module is declared in package.json', (t) => {
    const {fallback} = config.resolve as Resolve;
    const {
        dependencies = {},
        devDependencies = {},
    } = pkg as Manifest;
    
    const declared = Object.keys({
        ...dependencies,
        ...devDependencies,
    });
    
    const names = Object
        .values(fallback)
        .filter(isString)
        .map(getPackageName);
    
    const result = names.filter((name) => !declared.includes(name));
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});
