import {test, stub} from 'supertape';
import {GlobalExceptionFilter} from './exception.filter.ts';

test('error filter: returns 500 for unknown errors', async (t) => {
    const filter = new GlobalExceptionFilter();
    const json = stub();
    const status = stub().returns({
        json,
    });
    const res = {
        status,
    };
    
    await filter.catch(Error('something broke'), {
        switchToHttp: () => ({
            getResponse: () => res,
            getRequest: () => ({}),
        }),
    });
    
    t.calledWith(status, [500]);
    t.end();
});

test('error filter: returns upstream status for HttpException', async (t) => {
    const filter = new GlobalExceptionFilter();
    const json = stub();
    const status = stub().returns({
        json,
    });
    const res = {
        status,
    };
    
    const err = Error('Not found');
    
    err.status = 404;
    err.response = {
        status: 404,
    };
    
    await filter.catch(err, {
        switchToHttp: () => ({
            getResponse: () => res,
            getRequest: () => ({}),
        }),
    });
    
    t.calledWith(status, [404]);
    t.end();
});

test('error filter: returns upstream message', async (t) => {
    const filter = new GlobalExceptionFilter();
    const json = stub();
    const status = stub().returns({
        json,
    });
    const res = {
        status,
    };
    
    await filter.catch(Error('custom error'), {
        switchToHttp: () => ({
            getResponse: () => res,
            getRequest: () => ({}),
        }),
    });
    
    t.calledWith(json, ['custom error']);
    t.end();
});

