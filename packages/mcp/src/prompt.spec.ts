import {test} from 'supertape';
import * as prompt from './prompt.ts';

const textOf = (goal: string) => prompt.handler({
    goal,
}).messages[0].content.text;

test('prompt: the name is new_rule', (t) => {
    t.equal(prompt.name, 'new_rule');
    t.end();
});

test('prompt: takes a goal', (t) => {
    const result = Object.keys(prompt.argsSchema);
    const expected = ['goal'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('prompt: one user message', (t) => {
    const {messages} = prompt.handler({
        goal: 'x',
    });
    
    const result: string[] = [];
    
    for (const {role} of messages) {
        result.push(role);
    }
    
    const expected = ['user'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('prompt: the message carries the goal', (t) => {
    t.match(textOf('replace var with let'), 'replace var with let');
    t.end();
});

test('prompt: the message names the tools in order', (t) => {
    const text = textOf('x');
    const order: number[] = [];
    
    for (const tool of [
        'get_example',
        'test_pattern',
        'validate',
        'find_places',
        'transform',
    ]) {
        order.push(text.indexOf(tool));
    }
    
    const result = order.every((at, index) => at > -1 && (!index || at > order[index - 1]));
    
    t.ok(result);
    t.end();
});

test('prompt: the message asks for a fixture with nothing to find', (t) => {
    t.match(textOf('x'), 'nothing to find');
    t.end();
});
