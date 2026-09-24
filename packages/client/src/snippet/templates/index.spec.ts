import {test} from 'supertape';
import {categories, fixtures, templates} from './index.ts';

test('snippet: templates: categories has 13 entries', (t) => {
    t.equal(categories.length, 13);
    t.end();
});

test('snippet: fixtures: map has 13 entries', (t) => {
    t.equal(Object.keys(fixtures).length, 13);
    t.end();
});

test('snippet: fixtures: Replacer contains ternary', (t) => {
    t.ok(fixtures.Replacer.includes('?'));
    t.end();
});

test('snippet: fixtures: Includer contains object method', (t) => {
    t.ok(fixtures.Includer.includes('greet()'));
    t.end();
});

test('snippet: fixtures: Traverser contains duplicate imports', (t) => {
    t.ok(fixtures.Traverser.includes("import {a} from 'x';"));
    t.end();
});

test('snippet: fixtures: Declarator contains putout call', (t) => {
    t.ok(fixtures.Declarator.includes('putout(source'));
    t.end();
});

test('snippet: fixtures: Scanner contains filesystem comment', (t) => {
    t.ok(fixtures.Scanner.includes('filesystem plugin'));
    t.end();
});

test('snippet: fixtures: Finder contains duplicate declarations', (t) => {
    t.ok(fixtures.Finder.includes('const x = 1;'));
    t.end();
});

test('snippet: fixtures: JSON contains processor', (t) => {
    t.ok(fixtures.JSON.includes('__putout_processor_json'));
    t.end();
});

test('snippet: fixtures: YAML contains processor', (t) => {
    t.ok(fixtures.YAML.includes('__putout_processor_yaml'));
    t.end();
});

test('snippet: fixtures: TOML contains processor', (t) => {
    t.ok(fixtures.TOML.includes('__putout_processor_toml'));
    t.end();
});

test('snippet: fixtures: Markdown contains heading', (t) => {
    t.ok(fixtures.Markdown.includes('heading(2'));
    t.end();
});

test('snippet: fixtures: CSS contains processor', (t) => {
    t.ok(fixtures.CSS.includes('__putout_processor_css'));
    t.end();
});

test('snippet: fixtures: Docker contains processor', (t) => {
    t.ok(fixtures.Docker.includes('__putout_processor_docker'));
    t.end();
});

test('snippet: fixtures: Ignore contains processor', (t) => {
    t.ok(fixtures.Ignore.includes('__putout_processor_ignore'));
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
