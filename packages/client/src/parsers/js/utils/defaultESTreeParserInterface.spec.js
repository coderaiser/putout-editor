import {test} from 'supertape';
import defaultESTreeParserInterface from './defaultESTreeParserInterface.js';

test('defaultESTreeParserInterface: opensByDefault returns true for Program node', (t) => {
    const result = defaultESTreeParserInterface.opensByDefault({type: 'Program'}, 'body');
    
    t.ok(result);
    t.end();
});

test('defaultESTreeParserInterface: opensByDefault returns true for key body on any node', (t) => {
    const result = defaultESTreeParserInterface.opensByDefault(null, 'body');
    
    t.ok(result);
    t.end();
});

test('defaultESTreeParserInterface: opensByDefault returns true for key elements', (t) => {
    const result = defaultESTreeParserInterface.opensByDefault(null, 'elements');
    
    t.ok(result);
    t.end();
});

test('defaultESTreeParserInterface: opensByDefault returns true for key declarations', (t) => {
    const result = defaultESTreeParserInterface.opensByDefault(null, 'declarations');
    
    t.ok(result);
    t.end();
});

test('defaultESTreeParserInterface: opensByDefault returns true for key expression', (t) => {
    const result = defaultESTreeParserInterface.opensByDefault(null, 'expression');
    
    t.ok(result);
    t.end();
});

test('defaultESTreeParserInterface: opensByDefault returns false for other keys', (t) => {
    const result = defaultESTreeParserInterface.opensByDefault(null, 'foo');
    
    t.notOk(result);
    t.end();
});
