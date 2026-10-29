import {test, stub} from 'supertape';
import * as findPlaces from './finder.ts';
import * as transform from './transformer.ts';
import * as parse from './parser.ts';
import * as snippet from './snippet.ts';
import * as validate from './validator.ts';
import {learnNode, learnExample} from './learn.ts';

const BROKEN = 'export const report = (';

test('errors: find_places marks a broken plugin as an error', async (t) => {
    const {isError} = await findPlaces.handler({
        fixture: 'a;',
        plugin: BROKEN,
    });
    
    t.ok(isError);
    t.end();
});

test('errors: transform marks a broken plugin as an error', async (t) => {
    const {isError} = await transform.handler({
        fixture: 'a;',
        plugin: BROKEN,
    });
    
    t.ok(isError);
    t.end();
});

test('errors: parse marks broken source as an error', async (t) => {
    const {isError} = await parse.handler({
        source: 'const = ;',
    });
    
    t.ok(isError);
    t.end();
});

test('errors: learn_node marks an unknown id as an error', (t) => {
    const {isError} = learnNode.handler({
        id: 'nope',
    });
    
    t.ok(isError);
    t.end();
});

test('errors: learn_example marks an unknown id as an error', (t) => {
    const {isError} = learnExample.handler({
        id: 'nope',
    });
    
    t.ok(isError);
    t.end();
});

test('errors: fetch_snippet marks a missing snippet as an error', async (t) => {
    snippet.setFetcher(() => ({
        ok: false,
        status: 404,
        json: stub().resolves({}),
    } as never));
    
    const {isError} = await snippet.handler({
        snippet: 'abc123',
    });
    
    t.ok(isError);
    t.end();
});

test('errors: validate marks a plugin that is not ok as an error', (t) => {
    const {isError} = validate.handler({
        plugin: BROKEN,
    });
    
    t.ok(isError);
    t.end();
});

test('errors: validate does not mark ok as an error', (t) => {
    const result = 'isError' in validate.handler({
        plugin: 'export const report = () => "x";\nexport const fix = () => {};\nexport const traverse = () => ({});',
    });
    
    t.notOk(result);
    t.end();
});
