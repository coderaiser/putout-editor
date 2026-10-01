import {test} from 'supertape';
import * as exportTree from './export-tree.ts';
import * as exportTokens from './export-tokens.ts';
import Tree from './editor-ast-tree/Tree.tsx';

test('export-tree: Tree is the editor-ast-tree default export', (t) => {
    const expected = Tree;
    const result = exportTree.Tree;
    
    t.equal(result, expected);
    t.end();
});

test('export-tree: exports Tree and nothing else', (t) => {
    const expected: string[] = ['Tree'];
    const result = Object.keys(exportTree);
    
    t.deepEqual(result, expected);
    t.end();
});

test('export-tokens: loads the stylesheet for its side effect', (t) => {
    const expected: string[] = ['tokens'];
    const result = Object.keys(exportTokens);
    
    t.deepEqual(result, expected);
    t.end();
});
