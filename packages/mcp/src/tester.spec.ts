import {test} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './tester.ts';

const call = async (args: {
    fixture: string;
    key: string;
    to?: string;
}) => JSON.parse((await handler(args)).content[0].text);

test('local test-pattern: name is test_pattern', (t) => {
    const result = name;
    const expected = 'test_pattern';
    
    t.equal(result, expected);
    t.end();
});

test('local test-pattern: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local test-pattern: schema has fixture, key and to', (t) => {
    const result = Object
        .keys(schema.shape)
        .sort();
    
    const expected = [
        'fixture',
        'key',
        'to',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local test-pattern: counts every match', async (t) => {
    const result = (await call({
        fixture: 'const x = 1;\nconst s = "t";\n',
        key: 'const __a = __b',
    })).matched;
    
    const expected = 2;
    
    t.equal(result, expected);
    t.end();
});

test('local test-pattern: reports what each placeholder bound to', async (t) => {
    const {bound} = await call({
        fixture: 'const x = 1;\n',
        key: 'const __a = __b',
    });
    
    const result = [
        bound.__a[0].trim(),
        bound.__b[0].trim(),
    ];
    
    const expected = [
        'x;',
        '1;',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local test-pattern: a bare placeholder matches an identifier', async (t) => {
    const result = (await call({
        fixture: 'const x = 1;\n',
        key: '__a',
    })).matched;
    
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('local test-pattern: nothing matched is reported as zero, with a hint', async (t) => {
    const out = await call({
        fixture: 'const x = 1;\n',
        key: 'f(__a)',
    });
    
    const result = [out.matched, typeof out.hint];
    const expected = [0, 'string'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local test-pattern: a replacement may reuse a name the key declared', async (t) => {
    const out = await call({
        fixture: 'f(1);\n',
        key: 'f(__a)',
        to: 'g(__a)',
    });
    
    const result = out.replacement.code;
    const expected = 'g(1);\n';
    
    t.equal(result, expected);
    t.end();
});

test('local test-pattern: a replacement naming an unbound value is an error', async (t) => {
    const out = await call({
        fixture: 'f(1);\n',
        key: 'f(__a)',
        to: 'g(__b)',
    });
    
    const result = out.replacement.error;
    const expected = '☝️ Looks like template values not linked: ["__a"] -> ["__b"]';
    
    t.equal(result, expected);
    t.end();
});

test('local test-pattern: the silent no-op is called out, not passed off as changed', async (t) => {
    const out = await call({
        fixture: 'f(1);\n',
        key: 'f(__a__)',
        to: 'g(__a__)',
    });
    
    const result = [out.replacement.changed, typeof out.replacement.note];
    const expected = [false, 'string'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local test-pattern: a key that is not a pattern reports the parse error', async (t) => {
    const out = await call({
        fixture: 'f(1);\n',
        key: 'f(',
    });
    
    const result = typeof out.error;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local test-pattern: a bad key is told what to read', async (t) => {
    const out = await call({
        fixture: 'f(1);\n',
        key: 'f(',
    });
    
    const result = out.hint;
    const expected = 'A replacement may only reuse a name the key declared. That is what "Looks like template values not linked" means.';
    
    t.equal(result, expected);
    t.end();
});

test('local test-pattern: an unreadable fixture is reported, not thrown', async (t) => {
    const {content} = await handler({
        fixture: '',
        key: 'f(__a)',
    });
    
    const result = typeof content[0].text;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local test-pattern: __args matches any argument count', async (t) => {
    const result = (await call({
        fixture: 'f();\nf(1, 2, 3);\n',
        key: 'f(__args)',
    })).matched;
    
    const expected = 2;
    
    t.equal(result, expected);
    t.end();
});
