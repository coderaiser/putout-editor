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
        output: 'if (hello)\n    world();\nelse\n    party();',
    },
    Includer: {
        places: 1,
        output: 'const obj = {};',
    },
    Traverser: {
        places: 1,
        output: 'import {a, b} from \'x\';',
    },
    Declarator: {
        places: 1,
        output: 'import putout from \'putout\';\n\nconst {code} = putout(source, {\n    plugins: [],\n});',
    },
    Scanner: {
        places: 1,
        output: '__putout_processor_filesystem(["/", "/index.js"]);',
    },
    Finder: {
        places: 2,
        output: '',
    },
    JSON: {
        places: 1,
        output: '__putout_processor_json({\n    "keywords": ["cat", "dog"]\n});',
    },
    YAML: {
        places: 1,
        output: '__putout_processor_yaml({\n    "jobs": {\n        "build": {\n            "runs-on": "ubuntu-latest"\n        }\n    }\n});',
    },
    TOML: {
        places: 1,
        output: '__putout_processor_toml({});',
    },
    Markdown: {
        places: 1,
        output: '__putout_processor_markdown([\n    heading(2, \'Hello World\'),\n]);',
    },
    CSS: {
        places: 1,
        output: '__putout_processor_css([\n    declaration(\'margin\', dimension(8, \'px\')),\n]);',
    },
    Docker: {
        places: 1,
        output: '__putout_processor_docker([\n    [\n        "LABEL",\n        "org.opencontainers.image.authors=John <john@example.com>"\n    ]\n]);',
    },
    Ignore: {
        places: 1,
        output: '__putout_processor_ignore(["*.lock", "node_modules"]);',
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

