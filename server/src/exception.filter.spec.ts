import {test, stub} from 'supertape';
import type {ArgumentsHost, HttpException} from '@nestjs/common';
import {GlobalExceptionFilter} from './exception.filter.ts';

function createHost(res: unknown): ArgumentsHost {
    return ({
        switchToHttp: () => ({
            getResponse: () => res,
            getRequest: () => ({}),
        }),
    } as unknown) as ArgumentsHost;
}

test('error filter: returns 500 for unknown errors', async (t) => {
    const filter = new GlobalExceptionFilter();
    const json = stub();
    
    const status = stub().returns({
        json,
    });
    
    const res = {
        status,
    };
    
    await filter.catch(Error('something broke'), createHost(res));
    
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
    
    const err: Error & {
        status?: number;
        response?: {
            status: number;
        };
    } = Error('Not found');
    
    err.status = 404;
    err.response = {
        status: 404,
    };
    
    await filter.catch(err, createHost(res));
    
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
    
    await filter.catch(Error('custom error'), createHost(res));
    
    t.calledWith(json, ['custom error']);
    t.end();
});

test('error filter: uses getStatus and message from HttpException', async (t) => {
    const filter = new GlobalExceptionFilter();
    const json = stub();
    
    const status = stub().returns({
        json,
    });
    
    const res = {
        status,
    };
    
    const err = new HttpException('Forbidden', 403);
    
    await filter.catch(err, createHost(res));
    
    t.calledWith(status, [403]);
    t.end();
});

test('error filter: uses response.status from upstream error when status not directly set', async (t) => {
    const filter = new GlobalExceptionFilter();
    const json = stub();
    
    const status = stub().returns({
        json,
    });
    
    const res = {
        status,
    };
    
    await filter.catch({
        response: {
            status: 418,
        },
    }, createHost(res));
    
    t.calledWith(status, [418]);
    t.end();
});

test('error filter: uses exception.status when both are set on upstream error', async (t) => {
    const filter = new GlobalExceptionFilter();
    const json = stub();
    
    const status = stub().returns({
        json,
    });
    
    const res = {
        status,
    };
    
    await filter.catch({
        status: 503,
        response: {
            status: 502,
        },
    }, createHost(res));
    
    t.calledWith(status, [503]);
    t.end();
});

test('error filter: handles upstream error with only message and no response', async (t) => {
    const filter = new GlobalExceptionFilter();
    const json = stub();
    
    const status = stub().returns({
        json,
    });
    
    const res = {
        status,
    };
    
    await filter.catch({message: 'network error'}, createHost(res));
    
    t.calledWith(json, ['network error']);
    t.end();
});
