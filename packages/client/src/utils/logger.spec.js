import {test, stub} from 'supertape';
import {logEvent, logError} from './logger.js';

test('logger: logEvent: calls console.log with category, action, label', (t) => {
    const {log: original} = console;
    const log = stub();
    
    console.log = log;
    logEvent('analytics', 'click', 'button');
    console.log = original;
    
    t.calledWith(log, ['analytics', 'click', 'button']);
    t.end();
});

test('logger: logError: calls console.log with description and fatal flag', (t) => {
    const {log: original} = console;
    const log = stub();
    
    console.log = log;
    logError('Something went wrong', true);
    console.log = original;
    
    t.calledWith(log, [
        'Something went wrong',
        true,
    ]);
    t.end();
});
