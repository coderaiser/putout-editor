import replacer from './replacer.ts';
import includer from './includer.ts';
import traverser from './traverser.ts';
import declarator from './declarator.ts';
import scanner from './scanner.ts';
import finder from './finder.ts';
import json from './json.ts';
import yaml from './yaml.ts';
import toml from './toml.ts';
import markdown from './markdown.ts';
import css from './css.ts';
import docker from './docker.ts';
import ignore from './ignore.ts';
import replacerFixture from './fixtures/replacer.js';
import includerFixture from './fixtures/includer.js';
import traverserFixture from './fixtures/traverser.js';
import declaratorFixture from './fixtures/declarator.js';
import scannerFixture from './fixtures/scanner.js';
import finderFixture from './fixtures/finder.js';
import jsonFixture from './fixtures/json.js';
import yamlFixture from './fixtures/yaml.js';
import tomlFixture from './fixtures/toml.js';
import markdownFixture from './fixtures/markdown.js';
import cssFixture from './fixtures/css.js';
import dockerFixture from './fixtures/docker.js';
import ignoreFixture from './fixtures/ignore.js';

export {
    replacer,
    includer,
    traverser,
    declarator,
    scanner,
    finder,
    json,
    yaml,
    toml,
    markdown,
    css,
    docker,
    ignore,
};

export const categories = [
    'Replacer',
    'Includer',
    'Traverser',
    'Declarator',
    'Scanner',
    'Finder',
    'JSON',
    'YAML',
    'TOML',
    'Markdown',
    'CSS',
    'Docker',
    'Ignore',
] as const;

export type SnippetCategory = typeof categories[number];

export const templates: Record<SnippetCategory, string> = {
    Replacer: replacer,
    Includer: includer,
    Traverser: traverser,
    Declarator: declarator,
    Scanner: scanner,
    Finder: finder,
    JSON: json,
    YAML: yaml,
    TOML: toml,
    Markdown: markdown,
    CSS: css,
    Docker: docker,
    Ignore: ignore,
};

export const fixtures: Record<SnippetCategory, string> = {
    Replacer: replacerFixture,
    Includer: includerFixture,
    Traverser: traverserFixture,
    Declarator: declaratorFixture,
    Scanner: scannerFixture,
    Finder: finderFixture,
    JSON: jsonFixture,
    YAML: yamlFixture,
    TOML: tomlFixture,
    Markdown: markdownFixture,
    CSS: cssFixture,
    Docker: dockerFixture,
    Ignore: ignoreFixture,
};
