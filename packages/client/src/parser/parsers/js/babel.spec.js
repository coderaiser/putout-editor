import {test} from 'supertape';
import {estreeToBabel} from 'estree-to-babel';
import * as babylon from '@babel/parser';
import babelParser from './babel.js';

const isNumber = (a) => !Number.isNaN(a) && typeof a === 'number';

const code = 'const hello = world(1);';

function parse() {
    const ast = babelParser.parse(babylon, code, babelParser.getDefaultOptions());
    
    return estreeToBabel(ast);
}

function walkNodes(node, visit, seen = new WeakSet()) {
    if (!node || typeof node !== 'object' || seen.has(node))
        return;
    
    seen.add(node);
    
    if (Array.isArray(node)) {
        for (const child of node)
            walkNodes(child, visit, seen);
        
        return;
    }
    
    visit(node);
    
    for (const key of Object.keys(node))
        walkNodes(node[key], visit, seen);
}

test('babel: nodeToRange returns start/end for node with numeric positions', (t) => {
    const ast = parse();
    const [node] = ast.program.body;
    
    const result = babelParser.nodeToRange(node);
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
