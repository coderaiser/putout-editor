import {test, stub} from 'supertape';
import {
    createLog,
    log,
    logEvent,
    logError,
} from './logger.ts';

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

test('logger: createLog: event writes to log', (t) => {
    const target = {
        log: stub(),
        error: stub(),
    };
    
    createLog(target).event('analytics', 'click');
    
    t.calledWith(target.log, ['analytics', 'click']);
    t.end();
});

test('logger: createLog: error writes to error', (t) => {
    const target = {
        log: stub(),
        error: stub(),
    };
    
    createLog(target).error('Something went wrong', true);
    
    t.calledWith(target.error, ['Something went wrong', true]);
    t.end();
});
