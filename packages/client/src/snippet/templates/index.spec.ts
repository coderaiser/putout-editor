import {test} from 'supertape';
import {putout} from 'putout';
import {initPlugin} from '../../parser/parsers/js/transformers/putout/init-plugin.ts';
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

// Source of truth: `packages/mcp/src/local/templates.spec.ts`, which
// runs every template through the same `putout` calls as the editor does.
const expected: Record<SnippetCategory, Expected> = {
    Replacer: {
        places: 1,
        output: '// Fixture: convert-ternary-to-if\n// Try clicking "Find Places" to see what the plugin matches,\n// then "Transform" to apply it 🧹\nif (hello)\n    world();\nelse\n    party();',
    },
    Includer: {
        places: 1,
        output: '// Fixture: remove-empty-method\n// The plugin removes methods with no params and no body.\nconst obj = {\n    greetWithName(name) {\n        return `hello ${name}`;\n    },\n};',
    },
    Traverser: {
        places: 1,
        output: '// Fixture: merge-duplicate-imports\n// The plugin merges two imports from the same source into one.\nimport {a, b} from \'x\';',
    },
    Declarator: {
        places: 1,
        output: 'import putout from \'putout\';\n\n// Fixture: declare-putout-imports\n// The plugin auto-inserts missing imports for putout/operator/types.\nconst {code} = putout(source, {\n    plugins: [],\n});',
    },
    Scanner: {
        places: 1,
        output: '// Fixture: find-files-without-tests (filesystem plugin)\n// Files listed here are the virtual filesystem the plugin scans.\n__putout_processor_filesystem([\n    "/",\n    "/index.js",\n    "/index.spec.js",\n    "/utils.js"\n]);',
    },
    Finder: {
        places: 1,
        output: '// Fixture: find-duplicate-values\n// The plugin finds variables whose initialiser is an identical literal.\nconst x = 1;\n\nconst z = 2;',
    },
    JSON: {
        places: 1,
        output: '// Fixture: remove-duplicate-keywords (package.json plugin)\n// The JSON processor wraps package.json fields as a function call.\n__putout_processor_json({\n    "keywords": ["putout", "codemod"]\n});',
    },
    YAML: {
        places: 1,
        output: '// Fixture: remove-empty-needs (GitHub Actions YAML plugin)\n__putout_processor_yaml({\n    "jobs": {\n        "build": {\n            "runs-on": "ubuntu-latest"\n        }\n    }\n});',
    },
    TOML: {
        places: 1,
        output: '// Fixture: remove-empty-dependencies (TOML plugin)\n__putout_processor_toml({});',
    },
    Markdown: {
        places: 1,
        output: '// Fixture: remove-trailing-spaces-from-heading (Markdown plugin)\n__putout_processor_markdown([\n    heading(2, \'Hello World\'),\n]);',
    },
    CSS: {
        places: 1,
        output: '// Fixture: remove-vendor-prefix (CSS plugin)\n__putout_processor_css([\n    declaration(\'user-select\', \'none\'),\n]);',
    },
    Docker: {
        places: 1,
        output: '// Fixture: convert-maintainer-to-label (Dockerfile plugin)\n__putout_processor_docker([\n    [\n        "LABEL",\n        "org.opencontainers.image.authors=John <john@example.com>"\n    ]\n]);',
    },
    Ignore: {
        places: 1,
        output: '// Fixture: fix-lock-extension (.gitignore plugin)\n__putout_processor_ignore(["*.lock", "node_modules"]);',
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

// ─── Replacer ───────────────────────────────────────────────────────────────────
test('templates: Replacer: transforms ternary into if statement', (t) => {
    const result = transform('Replacer');
    
    t.equal(result, expected.Replacer.output);
    t.end();
});

test('templates: Replacer: finds 1 place', (t) => {
    const result = findPlaces('Replacer');
    
    t.equal(result, expected.Replacer.places);
    t.end();
});

// ─── Includer ───────────────────────────────────────────────────────────────────
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

// ─── Scanner ───────────────────────────────────────────────────────────────────
test('templates: Scanner: keeps only the transformation result', (t) => {
    const result = transform('Scanner');
    
    t.equal(result, expected.Scanner.output);
    t.end();
});

test('templates: Scanner: finds 1 place', (t) => {
    const result = findPlaces('Scanner');
    
    t.equal(result, expected.Scanner.places);
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

// ─── Invariants a putout run cannot express ────────────────────────────────────
for (const category of categories) {
    test(`templates: ${category}: fixture starts with the fixture header`, (t) => {
        const result = fixtures[category].startsWith('// Fixture:');
        
        t.ok(result);
        t.end();
    });
    
    test(`templates: ${category}: template starts with the rule name`, (t) => {
        const result = templates[category]
            .split('\n')[0]
            .startsWith('// ');
        
        t.ok(result);
        t.end();
    });
}

test('templates: Scanner: does not hardcode unused.js', (t) => {
    const result = templates.Scanner.includes('unused.js');
    
    t.notOk(result);
    t.end();
});
