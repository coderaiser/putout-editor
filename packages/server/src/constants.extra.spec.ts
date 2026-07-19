import {test, stub} from 'supertape';
import {logError} from './constants.ts';

test('constants: logError: does not call log when condition is false', (t) => {
    const log = stub();
    logError(false, log);

    t.notCalled(log);
    t.end();
});
