import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import acornParser from './acorn.tsx';
import {type AstNode} from '../../../types.ts';

const noop = () => {};

type Loaded = {
    acorn: unknown;
    acornLoose: unknown;
    acornJsx: unknown;
};

const load = () => new Promise<Loaded>((resolve) => {
    acornParser.loadParser(resolve);
});

test('acorn: loadParser resolves acorn, acornLoose and acornJsx', async (t) => {
    const result = Object
        .keys(await load())
        .sort();
    const expected = [
        'acorn',
        'acornJsx',
        'acornLoose',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('acorn: parse uses the jsx parser by default', async (t) => {
    const parsers = await load();
    const ast = acornParser.parse(parsers, 'const a = <div/>;', acornParser.getDefaultOptions());
    
    const result = (ast as {
        type: string;
    }).type;
    
    const expected = 'Program';
    
    t.equal(result, expected);
    t.end();
});

test('acorn: parse uses acorn-loose when loose is set', async (t) => {
    const parsers = await load();
    const ast = acornParser.parse(parsers, 'const a = ;', {
        ...acornParser.getDefaultOptions(),
        loose: true,
    });
    
    const result = (ast as {
        type: string;
    }).type;
    
    const expected = 'Program';
    
    t.equal(result, expected);
    t.end();
});

test('acorn: parse uses plain acorn when jsx is off', async (t) => {
    const parsers = await load();
    const ast = acornParser.parse(parsers, 'const a = 1;', {
        ...acornParser.getDefaultOptions(),
        'plugins.jsx': false,
    });
    
    const result = (ast as {
        body: unknown[];
    }).body.length;
    
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('acorn: nodeToRange returns start and end', async (t) => {
    const parsers = await load();
    const ast = acornParser.parse(parsers, 'const a = 1;', acornParser.getDefaultOptions());
    
    const [node] = (ast as {
        body: AstNode[];
    }).body;
    
    const result = acornParser.nodeToRange(node);
    
    const expected = [
        node.start,
        node.end,
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('acorn: nodeToRange returns nothing without numeric positions', (t) => {
    const result = acornParser.nodeToRange({
        type: 'Identifier',
        loc: {
            start: {
                line: 1,
            },
        },
    } as AstNode);
    
    t.notOk(result);
    t.end();
});

test('acorn: getDefaultOptions enables jsx and module parsing', (t) => {
    const options = acornParser.getDefaultOptions();
    const result = {
        ecmaVersion: options.ecmaVersion,
        sourceType: options.sourceType,
        jsx: options['plugins.jsx'],
    };
    
    const expected = {
        ecmaVersion: 10,
        sourceType: 'module',
        jsx: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('acorn: settings offer every ecmaVersion up to 10', (t) => {
    const config = acornParser._getSettingsConfiguration();
    const [field] = config.fields;
    const result = Array.isArray(field) ? field[1] : [];
    
    const expected = [
        3,
        5,
        6,
        7,
        8,
        9,
        10,
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('acorn: renderSettings links to the acorn options and renders the fields', (t) => {
    const settings = acornParser.getDefaultOptions();
    const view = render(acornParser.renderSettings(settings, noop));
    const link = view.container.querySelector('a');
    
    cleanup();
    
    const result = link?.getAttribute('href');
    const expected = 'https://github.com/marijnh/acorn/blob/master/src/options.js';
    
    t.equal(result, expected);
    t.end();
});
