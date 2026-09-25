import {test} from 'supertape';
import {putout} from 'putout';
import {montag} from 'montag';
import {initPlugin} from '#transformer/init-plugin';
import {
    categories,
    fixtures,
    templates,
    type SnippetCategory,
} from './index.ts';

type Expected = {
    places: number;
    output: string;
};

// Source of truth for the categories whose expected output fits on one line.
// `Replacer` and `Scanner` are asserted inline with `montag` further down,
// because their expected output is multi-line.
const expected: Record<Exclude<SnippetCategory, 'Replacer' | 'Scanner'>, Expected> = {
    Includer: {
        places: 1,
        output: '// remove-empty-method\n// The plugin removes methods with no params and no body.\nconst obj = {\n    greetWithName(name) {\n        return `hello ${name}`;\n    },\n};',
    },
    Traverser: {
        places: 1,
        output: '// merge-duplicate-imports\n// The plugin merges two imports from the same source into one.\nimport {a, b} from \'x\';',
    },
    Declarator: {
        places: 1,
        output: 'import putout from \'putout\';\n\n// declare-putout-imports\n// The plugin auto-inserts missing imports for putout/operator/types.\nconst {code} = putout(source, {\n    plugins: [],\n});',
    },
    Finder: {
        places: 1,
        output: '// find-duplicate-values\n// The plugin finds variables whose initialiser is an identical literal.\nconst x = 1;\n\nconst z = 2;',
    },
    JSON: {
        places: 1,
        output: '// remove-duplicate-keywords (package.json plugin)\n// The JSON processor wraps package.json fields as a function call.\n__putout_processor_json({\n    "keywords": ["putout", "codemod"]\n});',
    },
    YAML: {
        places: 1,
        output: '// remove-empty-needs (GitHub Actions YAML plugin)\n__putout_processor_yaml({\n    "jobs": {\n        "build": {\n            "runs-on": "ubuntu-latest"\n        }\n    }\n});',
    },
    TOML: {
        places: 1,
        output: '// remove-empty-dependencies (TOML plugin)\n__putout_processor_toml({});',
    },
    Markdown: {
        places: 1,
        output: '// remove-trailing-spaces-from-heading (Markdown plugin)\n__putout_processor_markdown([\n    heading(2, \'Hello World\'),\n]);',
    },
    CSS: {
        places: 1,
        output: '// remove-vendor-prefix (CSS plugin)\n__putout_processor_css([\n    declaration(\'user-select\', \'none\'),\n]);',
    },
    Docker: {
        places: 1,
        output: '// convert-maintainer-to-label (Dockerfile plugin)\n__putout_processor_docker([\n    [\n        "LABEL",\n        "org.opencontainers.image.authors=John <john@example.com>"\n    ]\n]);',
    },
    Ignore: {
        places: 1,
        output: '// fix-lock-extension (.gitignore plugin)\n__putout_processor_ignore(["*.lock", "node_modules"]);',
    },
};

const transform = (category: SnippetCategory): string => {
    const {code} = putout(fixtures[category], {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates[category])],
        ],
    });
    
    return code.trimEnd();
};

const findPlaces = (category: SnippetCategory): number => {
    const {places} = putout(fixtures[category], {
        fix: false,
        plugins: [
            ['rule', initPlugin(templates[category])],
        ],
    });
    
    return places.length;
};

test('templates: categories has 13 entries', (t) => {
    t.equal(categories.length, 13);
    t.end();
});

test('templates: fixtures map has 13 entries', (t) => {
    t.equal(Object.keys(fixtures).length, 13);
    t.end();
});

test('templates: templates map has 13 entries', (t) => {
    t.equal(Object.keys(templates).length, 13);
    t.end();
});

test('templates: Replacer: finds 1 place', (t) => {
    const result = findPlaces('Replacer');
    
    t.equal(result, 1);
    t.end();
});

test('templates: Includer: removes empty method', (t) => {
    const result = transform('Includer');
    
    t.equal(result, expected.Includer.output);
    t.end();
});

test('templates: Includer: finds 1 place', (t) => {
    const result = findPlaces('Includer');
    
    t.equal(result, expected.Includer.places);
    t.end();
});

// ─── Traverser ─────────────────────────────────────────────────────────────────
test('templates: Traverser: merges duplicate imports', (t) => {
    const result = transform('Traverser');
    
    t.equal(result, expected.Traverser.output);
    t.end();
});

test('templates: Traverser: finds 1 place', (t) => {
    const result = findPlaces('Traverser');
    
    t.equal(result, expected.Traverser.places);
    t.end();
});

// ─── Declarator ────────────────────────────────────────────────────────────────
test('templates: Declarator: inserts missing putout import', (t) => {
    const result = transform('Declarator');
    
    t.equal(result, expected.Declarator.output);
    t.end();
});

test('templates: Declarator: finds 1 place', (t) => {
    const result = findPlaces('Declarator');
    
    t.equal(result, expected.Declarator.places);
    t.end();
});

test('templates: Scanner: keeps only the transformation result', (t) => {
    const result = transform('Scanner');
    const expected = montag`
        __putout_processor_filesystem([
            "/",
            "/index.js",
            "/utils.js"
        ]);
    `;
    
    t.equal(result, expected);
    t.end();
});

test('templates: Scanner: finds 1 place', (t) => {
    const result = findPlaces('Scanner');
    
    t.equal(result, 1);
    t.end();
});

// ─── Finder ────────────────────────────────────────────────────────────────────
test('templates: Finder: removes the duplicate declaration', (t) => {
    const result = transform('Finder');
    
    t.equal(result, expected.Finder.output);
    t.end();
});

test('templates: Finder: finds 1 place', (t) => {
    const result = findPlaces('Finder');
    
    t.equal(result, expected.Finder.places);
    t.end();
});

// ─── JSON ──────────────────────────────────────────────────────────────────────
test('templates: JSON: removes duplicate keyword', (t) => {
    const result = transform('JSON');
    
    t.equal(result, expected.JSON.output);
    t.end();
});

test('templates: JSON: finds 1 place', (t) => {
    const result = findPlaces('JSON');
    
    t.equal(result, expected.JSON.places);
    t.end();
});

// ─── YAML ──────────────────────────────────────────────────────────────────────
test('templates: YAML: removes empty needs', (t) => {
    const result = transform('YAML');
    
    t.equal(result, expected.YAML.output);
    t.end();
});

test('templates: YAML: finds 1 place', (t) => {
    const result = findPlaces('YAML');
    
    t.equal(result, expected.YAML.places);
    t.end();
});

// ─── TOML ──────────────────────────────────────────────────────────────────────
test('templates: TOML: removes empty dependencies', (t) => {
    const result = transform('TOML');
    
    t.equal(result, expected.TOML.output);
    t.end();
});

test('templates: TOML: finds 1 place', (t) => {
    const result = findPlaces('TOML');
    
    t.equal(result, expected.TOML.places);
    t.end();
});

// ─── Markdown ──────────────────────────────────────────────────────────────────
test('templates: Markdown: removes trailing spaces from heading', (t) => {
    const result = transform('Markdown');
    
    t.equal(result, expected.Markdown.output);
    t.end();
});

test('templates: Markdown: finds 1 place', (t) => {
    const result = findPlaces('Markdown');
    
    t.equal(result, expected.Markdown.places);
    t.end();
});

// ─── CSS ───────────────────────────────────────────────────────────────────────
test('templates: CSS: removes vendor prefix', (t) => {
    const result = transform('CSS');
    
    t.equal(result, expected.CSS.output);
    t.end();
});

test('templates: CSS: finds 1 place', (t) => {
    const result = findPlaces('CSS');
    
    t.equal(result, expected.CSS.places);
    t.end();
});

// ─── Docker ────────────────────────────────────────────────────────────────────
test('templates: Docker: converts MAINTAINER to LABEL', (t) => {
    const result = transform('Docker');
    
    t.equal(result, expected.Docker.output);
    t.end();
});

test('templates: Docker: finds 1 place', (t) => {
    const result = findPlaces('Docker');
    
    t.equal(result, expected.Docker.places);
    t.end();
});

// ─── Ignore ────────────────────────────────────────────────────────────────────
test('templates: Ignore: fixes lock extension', (t) => {
    const result = transform('Ignore');
    
    t.equal(result, expected.Ignore.output);
    t.end();
});

test('templates: Ignore: finds 1 place', (t) => {
    const result = findPlaces('Ignore');
    
    t.equal(result, expected.Ignore.places);
    t.end();
});

test('templates: Scanner: does not hardcode unused.js', (t) => {
    const result = templates.Scanner.includes('unused.js');
    
    t.notOk(result);
    t.end();
});
