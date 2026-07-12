import {HttpException, ArgumentsHost} from '@nestjs/common';
import {test, stub} from 'supertape';
import {GlobalExceptionFilter} from './exception.filter.ts';

test('error filter: returns 500 for unknown errors', async (t) => {
    const filter = new GlobalExceptionFilter();
    const {status, response} = createResponse();
    
    await filter.catch(Error('something broke'), createHost(response));
    
    t.calledWith(status, [500]);
    t.end();
});

test('error filter: returns upstream status for HttpException', async (t) => {
    const filter = new GlobalExceptionFilter();
    const {response, status} = createResponse();
    
    const err = new HttpException('Forbidden', 403);
    
    await filter.catch(err, createHost(response));
    
    t.calledWith(status, [403]);
    t.end();
});

test('error filter: returns upstream message', async (t) => {
    const filter = new GlobalExceptionFilter();
    const {response, json} = createResponse();
    
    await filter.catch(Error('custom error'), createHost(response));
    
    t.calledWith(json, ['custom error']);
    t.end();
});

test('error filter: uses response.status from upstream error', async (t) => {
    const filter = new GlobalExceptionFilter();
    const {response, status} = createResponse();
    
    await filter.catch({
        response: {
            status: 418,
        },
    }, createHost(response));
    
    t.calledWith(status, [418]);
    t.end();
});

test('error filter: uses exception.status when both set', async (t) => {
    const filter = new GlobalExceptionFilter();
    const {response, status} = createResponse();
    
    await filter.catch({
        status: 503,
        response: {
            status: 502,
        },
    }, createHost(response));
    
    t.calledWith(status, [503]);
    t.end();
});

test('error filter: handles upstream error with only message', async (t) => {
    const filter = new GlobalExceptionFilter();
    const {response, json} = createResponse();
    
    await filter.catch({message: 'network error'}, createHost(response));
    
    t.calledWith(json, ['network error']);
    t.end();
});

type MockResponse = {
    status(code: number): {
        json(body: unknown): void;
    };
};

function createResponse(): {
    response: MockResponse;
    status: ReturnType<typeof stub>;
    json: ReturnType<typeof stub>;
} {
    const json = stub();
    
    const status = stub().returns({
        json,
    });
    
    return {
        response: {
            status: status as unknown as MockResponse['status'],
        },
        status,
        json,
    };
}

function createHost(response: MockResponse): ArgumentsHost {
    type HttpHost = ReturnType<ArgumentsHost['switchToHttp']>;
    
    const http: HttpHost = {
        getRequest<T = unknown>() {
            return {} as T;
        },
        
        getResponse<T = unknown>() {
            return response as T;
        },
        
        getNext<T = unknown>() {
            return undefined as T;
        },
    };
    
    return {
        getArgs<T extends any[] = any[]>() {
            return [] as unknown as T;
        },
        
        getArgByIndex<T = unknown>() {
            return undefined as T;
        },
        
        switchToRpc() {
            throw Error('Not implemented');
        },
        
        switchToWs() {
            throw Error('Not implemented');
        },
        
        switchToHttp() {
            return http;
        },
        
        getType<TContext extends string = 'http'>() {
            return 'http' as TContext;
        },
    };
}
