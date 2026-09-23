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
