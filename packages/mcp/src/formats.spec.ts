import {test} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './formats.ts';

const parse = () => JSON.parse(handler().content[0].text);

test('local formats: name is \'formats\'', (t) => {
    t.equal(name, 'formats');
    t.end();
});

test('local formats: description points at the client templates', (t) => {
    t.match(description, 'packages/client/src/snippet/templates');
    t.end();
});

test('local formats: takes no arguments', (t) => {
    const result = Object.keys(schema.shape);
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local formats: every format has an id', (t) => {
    const result = parse().every(({id}: {id: string;}) => Boolean(id));
    
    t.ok(result);
    t.end();
});

test('local formats: javascript needs no wrapper', (t) => {
    const [javascript] = parse().filter(({id}: {id: string;}) => id === 'javascript');
    const result = javascript.wrapper;
    
    t.notOk(result);
    t.end();
});

test('local formats: markdown is present with its operator', (t) => {
    const [markdown] = parse().filter(({id}: {id: string;}) => id === 'markdown');
    const result = markdown.operator;
    
    t.equal(result, '__markdown');
    t.end();
});

test('local formats: markdown fixture uses the processor wrapper', (t) => {
    const [markdown] = parse().filter(({id}: {id: string;}) => id === 'markdown');
    const result = markdown.fixture.startsWith('__putout_processor_markdown([');
    
    t.ok(result);
    t.end();
});

test('local formats: non-javascript formats all carry an operator', (t) => {
    const result = parse()
        .filter(({id}: {id: string;}) => id !== 'javascript')
        .every(({operator}: {operator: string;}) => Boolean(operator));
    
    t.ok(result);
    t.end();
});

test('local formats: every non-javascript wrapper names its processor', (t) => {
    const result = parse()
        .filter(({id}: {id: string;}) => id !== 'javascript')
        .every(({wrapper}: {wrapper: string;}) => wrapper.startsWith('__putout_processor_'));
    
    t.ok(result);
    t.end();
});

test('local formats: covers every processor the client templates use', (t) => {
    const result = parse()
        .map(({id}: {id: string;}) => id)
        .sort();
    
    const expected = [
        'css',
        'docker',
        'filesystem',
        'ignore',
        'javascript',
        'json',
        'markdown',
        'toml',
        'yaml',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});
