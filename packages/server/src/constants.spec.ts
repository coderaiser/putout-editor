import {test, stub} from 'supertape';
import {logError, MESSAGE} from './constants.ts';

test('constants: logError', (t) => {
    const log = stub();
    logError(true, log);
    
    t.calledWith(log, [MESSAGE]);
    t.end();
});
