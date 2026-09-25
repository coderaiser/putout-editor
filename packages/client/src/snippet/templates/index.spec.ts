import {test} from 'supertape';
import {
    categories,
    fixtures,
    templates,
} from './index.ts';

test('snippet: templates: categories has 13 entries', (t) => {
    t.equal(categories.length, 13);
    t.end();
});

test('snippet: fixtures: map has 13 entries', (t) => {
    t.equal(Object.keys(fixtures).length, 13);
    t.end();
});

test('snippet: fixtures: Replacer contains ternary', (t) => {
    const result = fixtures.Replacer.includes('?');
    
    t.ok(result);
    t.end();
});

test('snippet: fixtures: Includer contains object method', (t) => {
    const result = fixtures.Includer.includes('greet()');
    
    t.ok(result);
    t.end();
});

test('snippet: fixtures: Traverser contains duplicate imports', (t) => {
    const result = fixtures.Traverser.includes('import {a} from \'x\';');
    
    t.ok(result);
    t.end();
});

test('snippet: fixtures: Declarator contains putout call', (t) => {
    const result = fixtures.Declarator.includes('putout(source');
    
    t.ok(result);
    t.end();
});

test('snippet: fixtures: Scanner contains filesystem processor', (t) => {
    const result = fixtures.Scanner.includes('__putout_processor_filesystem');
    
    t.ok(result);
    t.end();
});

test('snippet: fixtures: Finder contains duplicate declarations', (t) => {
    const result = fixtures.Finder.includes('const x = 1;');
    
    t.ok(result);
    t.end();
});

test('snippet: fixtures: JSON contains processor', (t) => {
    const result = fixtures.JSON.includes('__putout_processor_json');
    
    t.ok(result);
    t.end();
});

test('snippet: fixtures: YAML contains processor', (t) => {
    const result = fixtures.YAML.includes('__putout_processor_yaml');
    
    t.ok(result);
    t.end();
});

test('snippet: fixtures: TOML contains processor', (t) => {
    const result = fixtures.TOML.includes('__putout_processor_toml');
    
    t.ok(result);
    t.end();
});

test('snippet: fixtures: Markdown contains heading', (t) => {
    const result = fixtures.Markdown.includes('heading(2');
    
    t.ok(result);
    t.end();
});

test('snippet: fixtures: CSS contains processor', (t) => {
    const result = fixtures.CSS.includes('__putout_processor_css');
    
    t.ok(result);
    t.end();
});

test('snippet: fixtures: Docker contains processor', (t) => {
    const result = fixtures.Docker.includes('__putout_processor_docker');
    
    t.ok(result);
    t.end();
});

test('snippet: fixtures: Ignore contains processor', (t) => {
    const result = fixtures.Ignore.includes('__putout_processor_ignore');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: templates map has 13 entries', (t) => {
    t.equal(Object.keys(templates).length, 13);
    t.end();
});

test('snippet: templates: Replacer starts with montag comment', (t) => {
    const result = templates.Replacer
        .split('\n')[0]
        .startsWith('// ');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Replacer contains the master broom report', (t) => {
    const result = templates.Replacer.includes('Use \'if\' instead of ternary 🧹');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Replacer second line is blank', (t) => {
    t.equal(templates.Replacer.split('\n')[1], '');
    t.end();
});

test('snippet: templates: Replacer contains replace export', (t) => {
    const result = templates.Replacer.includes('export const replace');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Includer contains include export', (t) => {
    const result = templates.Includer.includes('export const include');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Traverser contains traverse export', (t) => {
    const result = templates.Traverser.includes('export const traverse');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Declarator contains declare export', (t) => {
    const result = templates.Declarator.includes('export const declare');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Scanner contains scan export', (t) => {
    const result = templates.Scanner.includes('export const scan');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Finder starts with montag comment', (t) => {
    const result = templates.Finder
        .split('\n')[0]
        .startsWith('// ');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Finder does not contain match', (t) => {
    const result = /\bmatch\b/.test(templates.Finder);
    
    t.notOk(result);
    t.end();
});

test('snippet: templates: JSON contains __json', (t) => {
    const result = templates.JSON.includes('__json');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: YAML contains __yaml', (t) => {
    const result = templates.YAML.includes('__yaml');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: TOML contains __toml', (t) => {
    const result = templates.TOML.includes('__toml');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Markdown contains heading', (t) => {
    const result = templates.Markdown.includes('heading');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: CSS contains __css', (t) => {
    const result = templates.CSS.includes('__css');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Docker contains __docker', (t) => {
    const result = templates.Docker.includes('__docker');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Ignore contains __ignore', (t) => {
    const result = templates.Ignore.includes('__ignore');
    
    t.ok(result);
    t.end();
});

test('snippet: fixtures: Replacer comes from a fixture module', (t) => {
    const result = fixtures.Replacer.includes('hello ? world()');
    
    t.ok(result);
    t.end();
});

for (const category of categories) {
    test(`snippet: fixtures: ${category} has a fixture header`, (t) => {
        const result = fixtures[category].startsWith('// Fixture:');
        
        t.ok(result);
        t.end();
    });
}

test('snippet: templates: CSS uses traverse', (t) => {
    const result = templates.CSS.includes('export const traverse');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: CSS does not use __css.replace', (t) => {
    const result = templates.CSS.includes('__css.replace');
    
    t.notOk(result);
    t.end();
});

test('snippet: templates: Finder report uses name', (t) => {
    const result = templates.Finder.includes('{name}');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Finder uses VariableDeclarator', (t) => {
    const result = templates.Finder.includes('VariableDeclarator');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Scanner report uses getFilename', (t) => {
    const result = templates.Scanner.includes('getFilename');
    
    t.ok(result);
    t.end();
});

test('snippet: templates: Scanner does not hardcode unused.js', (t) => {
    const result = templates.Scanner.includes('unused.js');
    
    t.notOk(result);
    t.end();
});

