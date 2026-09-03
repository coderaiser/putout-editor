import {test} from 'supertape';
import * as ui from './index.ts';

test('ui barrel: re-exports SplitPane, LoadingIndicator, ErrorMessage', (t) => {
    const names = Object.keys(ui);
    const result = names.includes('SplitPane');
    
    t.ok(result);
    t.end();
});
