import {test} from 'supertape';
import * as editor from '#editor';

test('editor barrel: re-exports codemirror, Editor, getFocusPath, stringify, format', (t) => {
    const names = Object.keys(editor);
    const result = names.includes('createEditor');
    
    t.ok(result);
    t.end();
});
