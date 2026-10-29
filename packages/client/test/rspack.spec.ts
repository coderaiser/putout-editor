import {test} from 'supertape';
import config from '../rspack.config.js';
import pkg from '../package.json' with {
    type: 'json',
};

type Plugin = {
    name: string;
    _args: unknown[];
};
type IgnoreOptions = {
    resourceRegExp: RegExp;
};

const isPlugin = (name: string) => (plugin: Plugin) => plugin.name === name;
const getIgnored = ({_args}: Plugin) => (_args[0] as IgnoreOptions).resourceRegExp;
const getReplaced = ({_args}: Plugin) => _args[0] as RegExp;

const plugins = config.plugins as Plugin[];
const ignored = plugins
    .filter(isPlugin('IgnorePlugin'))
    .map(getIgnored);

const replaced = plugins
    .filter(isPlugin('NormalModuleReplacementPlugin'))
    .map(getReplaced);

const isIgnored = (name: string) => ignored.some((regExp) => regExp.test(name));
const isReplaced = (name: string) => replaced.some((regExp) => regExp.test(name));

test('client: rspack: hermes-parser is not in the bundle', (t) => {
    const result = isIgnored('hermes-parser');
    
    t.ok(result);
    t.end();
});

test('client: rspack: @putout/operator-match-files stays in the bundle', (t) => {
    const result = isIgnored('@putout/operator-match-files') || isReplaced('@putout/operator-match-files');
    
    t.notOk(result);
    t.end();
});

test('client: rspack: @putout/processor-css is an empty module', (t) => {
    const result = isReplaced('@putout/processor-css');
    
    t.ok(result);
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

test('client: rspack: each fallback module is declared in package.json', (t) => {
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
