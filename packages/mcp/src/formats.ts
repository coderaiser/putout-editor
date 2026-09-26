import {z} from 'zod';

export const name = 'formats';

export const description =
    'List the file formats putout-editor can transform, with the wrapper call, the ' +
    'operator and the node shapes a rule targets. Use this before writing a rule for ' +
    'anything other than plain JavaScript, so the fixture and the matcher are in the ' +
    'format putout-editor actually stores. The source of truth is the client: ' +
    'packages/client/src/snippet/templates (one template + fixture per category).';

export const schema = z.object({});

type Format = {
    id: string;
    wrapper: string | null;
    operator: string | null;
    fixture: string;
};

const FORMATS: Format[] = [{
    id: 'javascript',
    wrapper: null,
    operator: null,
    fixture: 'const a = 1;',
}, {
    id: 'markdown',
    wrapper: '__putout_processor_markdown([...])',
    operator: '__markdown',
    fixture: `__putout_processor_markdown([
    heading(2, 'Hello World')
]);`,
}, {
    id: 'json',
    wrapper: '__putout_processor_json({...})',
    operator: '__json',
    fixture: `__putout_processor_json({
    "keywords": ["putout", "codemod"]
});`,
}, {
    id: 'yaml',
    wrapper: '__putout_processor_yaml({...})',
    operator: '__yaml',
    fixture: `__putout_processor_yaml({
    "jobs": {
        "build": {
            "needs": []
        }
    }
});`,
}, {
    id: 'toml',
    wrapper: '__putout_processor_toml({...})',
    operator: '__toml',
    fixture: `__putout_processor_toml({
    "dependencies": {}
});`,
}, {
    id: 'css',
    wrapper: '__putout_processor_css([...])',
    operator: '__css',
    fixture: `__putout_processor_css([
    rule(selector([
        classSelector('hello')
    ]), [
        declaration('box-shadow', valueList([
            functionValue('rgb', [0, 0, 0, percentage(20)])
        ]))
    ])
]);`,
}, {
    id: 'docker',
    wrapper: '__putout_processor_docker([...])',
    operator: '__docker',
    fixture: `__putout_processor_docker([
    ["MAINTAINER", "John <john@example.com>"]
]);`,
}, {
    id: 'ignore',
    wrapper: '__putout_processor_ignore([...])',
    operator: '__ignore',
    fixture: `__putout_processor_ignore([
    "*.lock", "node_modules"
]);`,
}, {
    id: 'filesystem',
    wrapper: '__putout_processor_filesystem([...])',
    operator: '__file',
    fixture: `__putout_processor_filesystem([
    "/",
    "/index.js"
]);`,
}];

export const handler = () => ({
    content: [{
        type: 'text' as const,
        text: JSON.stringify(FORMATS, null, 2),
    }],
});
