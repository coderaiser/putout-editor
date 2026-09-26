import {
    readdirSync,
    readFileSync,
    statSync,
} from 'node:fs';
import {join} from 'node:path';
import {test} from 'supertape';

const NAME = 'configure' + 'Store';
const SELF = 'spec-store-guard';

const walk = (dir: string): string[] => readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    
    return statSync(full).isDirectory() ? walk(full) : [full];
});

const offenders = walk('src')
    .filter((file) => /\.spec\.[jt]sx?$/.test(file) && !file.includes(SELF))
    .filter((file) => {
        // Comments are stripped so a prose mention is not a violation.
        const source = readFileSync(file, 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, '');
        
        return source.includes(NAME);
    });

test('store: no spec calls the store factory directly', (t) => {
    const result = offenders;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});
