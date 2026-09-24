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
export const fixtures: Record<SnippetCategory, string> = {
    Replacer: `hello ? world() : party();`,
    Includer: `const obj = {
    greet() { return 'hi'; },
};`,
    Traverser: `import {a} from 'x';
import {b} from 'x';`,
    Declarator: `const {code} = putout(source, {plugins: []});`,
    Scanner: `// filesystem plugin — no JS source needed`,
    Finder: `const x = 1;
const y = 1;`,
    JSON: `__putout_processor_json({
    "keywords": ["cat", "cat", "dog"]
});`,
    YAML: `__putout_processor_yaml({
    "jobs": {
        "build": {
            "needs": [],
            "runs-on": "ubuntu-latest"
        }
    }
});`,
    TOML: `__putout_processor_toml({
    "dependencies": {}
});`,
    Markdown: `__putout_processor_markdown([
    heading(2, "Hello World   ")
]);`,
    CSS: `__putout_processor_css([
    declaration("margin", valueList([
        dimension(8, "px"),
        dimension(8, "px"),
        dimension(8, "px"),
        dimension(8, "px"),
    ]))
]);`,
    Docker: `__putout_processor_docker([
    ["MAINTAINER", "John <john@example.com>"]
]);`,
    Ignore: `__putout_processor_ignore(["*.loc", "node_modules"]);`,
};
