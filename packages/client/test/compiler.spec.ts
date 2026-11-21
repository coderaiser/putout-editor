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

// The compiler skips these components and the page works. Fix one, then remove its line.
test('client: the React Compiler accepts every source file except the known ones', (t) => {
    const result = readdirSync(src, {
        recursive: true,
        encoding: 'utf8',
    })
        .filter(isSource)
        .flatMap(findingsOf)
        .sort();
    
    const expected = [
        'editor-ast-tree/Tree.tsx: (BuildHIR::lowerExpression) Handle YieldExpression expressions (line 81)',
        'editor-ast-tree/tree/Element.tsx: Cannot access refs during render: Cannot access ref value during render (line 150)',
        'parser/dialogs/SettingsDialog.tsx: [PruneHoistedContexts] Rewrite hoisted function references (line 33)',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});
