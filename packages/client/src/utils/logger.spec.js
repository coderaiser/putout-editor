import {test, stub} from 'supertape';
import {
    log,
    logEvent,
    logError,
} from './logger.js';

test('logger: logEvent: calls log.event with category, action, label', (t) => {
    const {event: original} = log;
    const event = stub();
    
    log.event = event;
    logEvent('analytics', 'click', 'button');
    log.event = original;
    
    t.calledWith(event, ['analytics', 'click', 'button']);
    t.end();
});

test('logger: logError: calls log.error with description and fatal flag', (t) => {
    const {error: original} = log;
    const error = stub();
    
    log.error = error;
    logError('Something went wrong', true);
    log.error = original;
    
    t.calledWith(error, [
        'Something went wrong',
        true,
    ]);
    t.end();
});
