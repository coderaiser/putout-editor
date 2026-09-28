import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import * as cssArchitecture from './index.js';

const ROOT = '/project';

const plugin = ['css-architecture', cssArchitecture];

const sourceOf = (name, content) => print(parseFilesystem([
    '/',
    `${ROOT}/`,
    [`${ROOT}/${name}`, content],
]));

const scan = (name, content) => putout(sourceOf(name, content), {
    fix: false,
    plugins: [
        ['filesystem', plugin],
    ],
}).places;

test('putout-editor: css-architecture: a rule in main.css', (t) => {
    const [place] = scan('main.css', '@import "./tokens.css";\n.a {\n    color: red;\n}\n');
    
    const result = place.message;
    const expected = `☝️ ${ROOT}/main.css: main.css is an entry point: @import only`;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: css-architecture: an at-rule that is not an import', (t) => {
    const result = scan('main.css', '@media screen {\n    .a {\n        color: red;\n    }\n}\n').length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: css-architecture: imports only', (t) => {
    const result = scan('main.css', '@import "./tokens.css";\n@import "./reset.css";\n').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: css-architecture: another file', (t) => {
    const result = scan('layout.css', '.a {\n    color: red;\n}\n').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});
