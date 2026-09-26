import {test} from 'supertape';
import {z} from 'zod';
import {tryCatch} from 'try-catch';
import {compilePlugin} from './plugin.ts';
import {handler as findPlaces} from './finder.ts';
import {
    handler,
    name,
    description,
    schema,
} from './examples.ts';

const isUndefined = (a: unknown): a is undefined => typeof a === 'undefined';

type Pattern = z.infer<typeof schema>['pattern'];

const PLUGIN_OPEN = '### Plugin\n```js\n';
const PLUGIN_CLOSE = '\n```\n\n### Fixture';

const patterns = schema.shape.pattern.options;

const text = (pattern: Pattern) => handler({
    pattern,
}).content[0].text;

const pluginOf = (output: string) => output
    .split(PLUGIN_OPEN)[1]
    .split(PLUGIN_CLOSE)[0];

const FIXTURE_OPEN = `\n\`\`\`

### Fixture
\`\`\`js
`;

const FIXTURE_CLOSE = '\n```';

const fixtureOf = (output: string) => output
    .split(FIXTURE_OPEN)[1]
    .split(FIXTURE_CLOSE)[0];

const compiles = (plugin: string) => {
    const [error] = tryCatch(compilePlugin, plugin);
    
    return !error;
};

test('local get-example: name is get_example', (t) => {
    t.equal(name, 'get_example');
    t.end();
});

test('local get-example: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local get-example: schema has pattern field', (t) => {
    t.ok('pattern' in schema.shape);
    t.end();
});

test('local get-example: returns plugin for replacer', (t) => {
    const result = text('replacer');
    
    t.match(result, 'replace');
    t.end();
});

test('local get-example: returns fixture for replacer', (t) => {
    const result = text('replacer');
    
    t.match(result, 'Fixture');
    t.end();
});

test('local get-example: returns plugin for traverser', (t) => {
    const result = text('traverser');
    
    t.match(result, 'traverse');
    t.end();
});

test('local get-example: returns plugin for includer', (t) => {
    const result = text('includer');
    
    t.match(result, 'include');
    t.end();
});

test('local get-example: returns plugin for finder', (t) => {
    const result = text('finder');
    
    t.match(result, 'find');
    t.end();
});

test('local get-example: returns plugin for declarator', (t) => {
    const result = text('declarator');
    
    t.match(result, 'declare');
    t.end();
});

test('local get-example: returns scanner fixture with filesystem format', (t) => {
    const result = text('scanner');
    
    t.match(result, '__putout_processor_filesystem');
    t.end();
});

test('local get-example: names the pattern in the output', (t) => {
    const result = text('includer');
    
    t.match(result, '## includer');
    t.end();
});

test('local get-example: exposes all 6 patterns', (t) => {
    const result = [...patterns].sort();
    const expected = [
        'declarator',
        'finder',
        'includer',
        'replacer',
        'scanner',
        'traverser',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local get-example: every example ships a compilable plugin', (t) => {
    const result = patterns.filter((pattern) => !compiles(pluginOf(text(pattern))));
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local get-example: every example ships a non empty fixture', (t) => {
    const result = patterns.filter((pattern) => fixtureOf(text(pattern)).trim() === '');
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local get-example: every example matches its own fixture', async (t) => {
    const results = await Promise.all(patterns.map(async (pattern) => {
        const {content} = await findPlaces({
            fixture: fixtureOf(text(pattern)),
            plugin: pluginOf(text(pattern)),
        });
        
        const [error, parsed] = tryCatch(JSON.parse, content[0].text);
        
        return {
            pattern,
            places: error === null || isUndefined(error) ? parsed.places.length : content[0].text,
        };
    }));
    
    t.deepEqual(results, patterns.map((pattern) => ({
        pattern,
        places: 1,
    })));
    t.end();
});
