import {test} from 'supertape';
import {handler as findPlaces} from './finder.ts';
import {handler as transform} from './transformer.ts';

type TemplateModule = {
    categories: readonly string[];
    fixtures: Record<string, string>;
    templates: Record<string, string>;
};

const templateURL = new URL('../../../client/src/snippet/templates/index.ts', import.meta.url).href;

const {
    categories,
    fixtures,
    templates,
} = await import(templateURL) as TemplateModule;

type Expected = {
    places: number;
    output: string;
};

const expected: Record<string, Expected> = {
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

const text = (result: {
    content: {
        text: string;
    }[];
}) => result.content[0].text;

const placesFrom = (source: string): unknown[] => {
    if (source.startsWith('Error:'))
        return [];
    
    try {
        const parsed = JSON.parse(source) as {places?: unknown};
        
        return Array.isArray(parsed.places) ? parsed.places : [];
    } catch {
        return [];
    }
};

test('mcp templates: every category has a non-empty fixture', (t) => {
    const empty = categories.filter((category) => !fixtures[category].trim());
    
    t.deepEqual(empty, []);
    t.end();
});

for (const category of categories) {
    test(`mcp templates: ${category} finds and transforms its fixture`, async (t) => {
        const plugin = templates[category];
        const fixture = fixtures[category];
        
        const found = text(await findPlaces({
            fixture,
            plugin,
        }));
        
        const transformed = text(await transform({
            fixture,
            plugin,
        }));
        
        const places = placesFrom(found);
        const result = found.startsWith('Error:') || transformed.startsWith('Error:') ? {
            error: found.startsWith('Error:') ? found : transformed,
        } : {
            places: places.length,
            output: transformed,
        };
        
        t.deepEqual(result, expected[category], `${category} MCP result`);
        t.end();
    });
}

