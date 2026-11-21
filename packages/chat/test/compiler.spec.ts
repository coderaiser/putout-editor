import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'supertape';
import {diagnose} from '@putout/editor-builder/diagnose';

const src = new URL('../src', import.meta.url).pathname;

const isSource = (name: string) => /\.tsx?$/.test(name) && !name.includes('.spec.');

const findingsOf = (name: string) => {
    const path = join(src, name);
    
    return diagnose(path, readFileSync(path, 'utf8')).map((text) => `${name}: ${text}`);
};

test('chat: the React Compiler accepts every source file', (t) => {
    const result = readdirSync(src, {
        recursive: true,
        encoding: 'utf8',
    })
        .filter(isSource)
        .flatMap(findingsOf);
    
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});
