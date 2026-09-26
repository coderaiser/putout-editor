import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {estreeToBabel} from 'estree-to-babel';
import * as babylon from '@babel/parser';
import babelParser from './babel.ts';
import {type AstNode} from '../../../types.ts';

const isNumber = (a: unknown): a is number => !Number.isNaN(a) && typeof a === 'number';

const code = 'const hello = world(1);';

function parse() {
    const ast = babelParser.parse(babylon, code, babelParser.getDefaultOptions());
    
    return estreeToBabel(ast as Parameters<typeof estreeToBabel>[0]);
}

function walkNodes(node: unknown, visit: (node: AstNode) => void, seen = new WeakSet<object>()) {
    if (!node || typeof node !== 'object' || seen.has(node))
        return;
    
    seen.add(node);
    
    if (Array.isArray(node)) {
        for (const child of node)
            walkNodes(child, visit, seen);
        
        return;
    }
    
    const record = node as Record<string, unknown>;
    visit(record as AstNode);
    
    for (const key of Object.keys(record))
        walkNodes(record[key], visit, seen);
}

test('babel: nodeToRange returns start/end for node with numeric positions', (t) => {
    const ast = parse();
    const [node] = ast.program.body;
    
    const result = babelParser.nodeToRange(node as Parameters<typeof babelParser.nodeToRange>[0]);
    const expected = [0, code.length];
    
    t.deepEqual(result, expected);
    t.end();
});

test('babel: nodeToRange returns undefined for loc object', (t) => {
    const loc = {
        start: {
            line: 1,
            column: 0,
            index: 0,
        },
        end: {
            line: 1,
            column: code.length,
            index: code.length,
        },
    };
    
    const result = babelParser.nodeToRange(loc);
    
    t.notOk(result);
    t.end();
});

test('babel: nodeToRange returns number pairs for every node of a real AST', (t) => {
    const ast = parse();
    let count = 0;
    let invalid;
    
    walkNodes(ast, (node) => {
        if (!node.type)
            return;
        
        const range = babelParser.nodeToRange(node);
        
        if (!range)
            return;
        
        ++count;
        
        if (!isNumber(range[0]) || typeof range[1] !== 'number')
            invalid = {
                type: node.type,
                range,
            };
    });
    
    const result = invalid || count > 0;
    
    t.ok(result);
    t.end();
});

// The plugin names the settings UI offers are not the names @babel/parser wants,

// so parse() remaps them. Each remap is a branch, and the point of the test is

// that the right shape reaches babel - an array [name, options] for the ones

// that need options, a bare string for the one that is dropped.
const parseWithPlugins = (plugins: string[]) => {
    const parsed: Record<string, unknown>[] = [];
    const babylon = {
        parse: (_code: string, options: Record<string, unknown>) => {
            parsed.push(options);
            
            return {};
        },
    };
    
    babelParser.parse(babylon, code, {
        ...babelParser.getDefaultOptions(),
        plugins,
    });
    
    return parsed[0].plugins;
};

test('babel: remaps decorators with decoratorsBeforeExport off', (t) => {
    const result = parseWithPlugins(['decorators']);
    const expected = [
        ['decorators', {
            decoratorsBeforeExport: false,
        }],
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('babel: remaps discardBinding with its syntaxType', (t) => {
    const result = parseWithPlugins(['discardBinding']);
    const expected = [
        ['discardBinding', {
            syntaxType: 'void',
        }],
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('babel: remaps pipelineOperator to the minimal proposal', (t) => {
    const result = parseWithPlugins(['pipelineOperator']);
    const expected = [
        ['pipelineOperator', {
            proposal: 'minimal',
        }],
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('babel: remaps optionalChainingAssign to the 2023-07 version', (t) => {
    const result = parseWithPlugins(['optionalChainingAssign']);
    const expected = [
        ['optionalChainingAssign', {
            version: '2023-07',
        }],
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('babel: drops recordAndTuple, which this babel cannot enable', (t) => {
    const result = parseWithPlugins(['recordAndTuple', 'jsx']);
    
    const expected = ['jsx'];
    
    t.deepEqual(result, expected);
    t.end();
});

// The settings field reads the stored plugins, falling back to the defaults

// when there are none. Both fallbacks are reachable from the configuration.
const pluginsField = () => {
    const config = babelParser._getSettingsConfiguration();
    const [field] = config.fields.filter((f) => typeof f === 'object' && 'key' in f && f.key === 'plugins');
    
    return field as unknown as {
        settings: (settings: Record<string, unknown>) => unknown;
    };
};

test('babel: the plugins setting falls back to the defaults when absent', (t) => {
    const result = pluginsField().settings({});
    const expected = babelParser.getDefaultOptions().plugins;
    
    t.deepEqual(result, expected);
    t.end();
});

test('babel: the plugins setting falls back when the stored value is empty', (t) => {
    const result = pluginsField().settings({
        plugins: null,
    });
    
    const expected = babelParser.getDefaultOptions().plugins;
    
    t.deepEqual(result, expected);
    t.end();
});

test('babel: the plugins setting uses the stored value when present', (t) => {
    const result = pluginsField().settings({
        plugins: ['jsx'],
    });
    
    const expected = ['jsx'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('babel: getNodeName returns a string type as it is', (t) => {
    const result = babelParser.getNodeName({
        type: 'Identifier',
    });
    
    const expected = 'Identifier';
    
    t.equal(result, expected);
    t.end();
});

test('babel: getNodeName names a token by its label', (t) => {
    const result = babelParser.getNodeName(({
        type: {
            label: 'name',
        }, // AstNode declares `type` as a string, but a token node carries a type
        // object - which is the arm this covers, hence the cast.
    } as unknown) as AstNode);
    
    const expected = 'Token (name)';
    
    t.equal(result, expected);
    t.end();
});

test('babel: renderSettings preserves plugin arrays in values and updates', (t) => {
    const updates: unknown[] = [];
    const onChange = (settings: unknown) => updates.push(settings);
    const plugins = ['jsx'];
    
    const settings = {
        ...babelParser.getDefaultOptions(),
        plugins,
    };
    
    const view = render(babelParser.renderSettings(settings, onChange));
    const checkbox = view.getByLabelText('jsx');
    const checked = checkbox instanceof HTMLInputElement && checkbox.checked;
    
    fireEvent.click(checkbox);
    cleanup();
    
    const result = {
        checked,
        updates,
        plugins,
    };
    
    const expected = {
        checked: true,
        updates: [{
            ...settings,
            plugins: [],
        }],
        plugins: ['jsx'],
    };
    
    t.deepEqual(result, expected);
    t.end();
});
