import {test} from 'supertape';
import {templates, categories} from './index.ts';

test('snippet: templates: categories has 13 entries', (t) => {
    t.equal(categories.length, 13);
    t.end();
});

test('snippet: templates: templates map has 13 entries', (t) => {
    t.equal(Object.keys(templates).length, 13);
    t.end();
});

test('snippet: templates: Replacer starts with montag comment', (t) => {
    t.ok(templates.Replacer.split('\n')[0].startsWith('// '));
    t.end();
});

test('snippet: templates: Replacer second line is blank', (t) => {
    t.equal(templates.Replacer.split('\n')[1], '');
    t.end();
});

test('snippet: templates: Replacer contains replace export', (t) => {
    t.ok(templates.Replacer.includes('export const replace'));
    t.end();
});

test('snippet: templates: Includer contains include export', (t) => {
    t.ok(templates.Includer.includes('export const include'));
    t.end();
});

test('snippet: templates: Traverser contains traverse export', (t) => {
    t.ok(templates.Traverser.includes('export const traverse'));
    t.end();
});

test('snippet: templates: Declarator contains declare export', (t) => {
    t.ok(templates.Declarator.includes('export const declare'));
    t.end();
});

test('snippet: templates: Scanner contains scan export', (t) => {
    t.ok(templates.Scanner.includes('export const scan'));
    t.end();
});

test('snippet: templates: Finder starts with montag comment', (t) => {
    t.ok(templates.Finder.split('\n')[0].startsWith('// '));
    t.end();
});

test('snippet: templates: JSON contains __json', (t) => {
    t.ok(templates.JSON.includes('__json'));
    t.end();
});

test('snippet: templates: YAML contains __yaml', (t) => {
    t.ok(templates.YAML.includes('__yaml'));
    t.end();
});

test('snippet: templates: TOML contains __toml', (t) => {
    t.ok(templates.TOML.includes('__toml'));
    t.end();
});

test('snippet: templates: Markdown contains heading', (t) => {
    t.ok(templates.Markdown.includes('heading'));
    t.end();
});

test('snippet: templates: CSS contains __css', (t) => {
    t.ok(templates.CSS.includes('__css'));
    t.end();
});

test('snippet: templates: Docker contains __docker', (t) => {
    t.ok(templates.Docker.includes('__docker'));
    t.end();
});

test('snippet: templates: Ignore contains __ignore', (t) => {
    t.ok(templates.Ignore.includes('__ignore'));
    t.end();
});
