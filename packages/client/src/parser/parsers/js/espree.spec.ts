import {test} from 'supertape';
import espreeParser from './espree.tsx';
import {type AstNode} from '../../../types.ts';

test('espree: nodeToRange returns start and end', (t) => {
    const node = {
        type: 'VariableDeclaration',
        start: 0,
        end: 13,
    } as AstNode;
    
    const result = espreeParser.nodeToRange(node);
    
    const expected = [0, 13];
    
    t.deepEqual(result, expected);
    t.end();
});

test('espree: nodeToRange returns nothing without numeric positions', (t) => {
    const node = {
        type: 'VariableDeclaration',
        loc: {
            start: {
                line: 1,
                column: 0,
            },
        },
    } as AstNode;
    
    const result = espreeParser.nodeToRange(node);
    
    t.notOk(result);
    t.end();
});
