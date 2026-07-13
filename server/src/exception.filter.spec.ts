import {HttpException, ArgumentsHost} from '@nestjs/common';
import {test, stub} from 'supertape';
import {GlobalExceptionFilter} from './exception.filter.ts';

const noop = () => {};

test('error filter: returns 500 for unknown errors', (t) => {
    const filter = new GlobalExceptionFilter();
    const {status, response} = createResponse();
    
    const {showLog} = hideLog();
    filter.catch(Error('something broke'), createHost(response));
    showLog();
    
    t.calledWith(status, [500]);
    t.end();
});

test('error filter: returns upstream status for HttpException', (t) => {
    const filter = new GlobalExceptionFilter();
    const {response, status} = createResponse();
    
    const err = new HttpException('Forbidden', 403);
    
    const {showLog} = hideLog();
    filter.catch(err, createHost(response));
    showLog();
    
    t.calledWith(status, [403]);
    t.end();
});

test('error filter: returns upstream message', (t) => {
    const filter = new GlobalExceptionFilter();
    const {response, json} = createResponse();
    
    const {showLog} = hideLog();
    filter.catch(Error('custom error'), createHost(response));
    showLog();
    
    t.calledWith(json, ['custom error']);
    t.end();
});

test('error filter: uses response.status from upstream error', (t) => {
    const filter = new GlobalExceptionFilter();
    const {response, status} = createResponse();
    
    const {showLog} = hideLog();
    filter.catch({
        response: {
            status: 418,
        },
    }, createHost(response));
    showLog();
    
    t.calledWith(status, [418]);
    t.end();
});

test('error filter: uses exception.status when both set', (t) => {
    const filter = new GlobalExceptionFilter();
    const {response, status} = createResponse();
    
    const {showLog} = hideLog();
    filter.catch({
        status: 503,
        response: {
            status: 502,
        },
    }, createHost(response));
    showLog();
    
    t.calledWith(status, [503]);
    t.end();
});

test('error filter: handles upstream error with only message', (t) => {
    const filter = new GlobalExceptionFilter();
    const {response, json} = createResponse();
    
    const {showLog} = hideLog();
    filter.catch({message: 'network error'}, createHost(response));
    showLog();
    
    t.calledWith(json, ['network error']);
    t.end();
});

test('putout editor: server: exception: status: returns 500 when upstream error has neither response nor message', (t) => {
    const filter = new GlobalExceptionFilter();
    const {response, status} = createResponse();
    
    const {showLog} = hideLog();
    filter.catch({}, createHost(response));
    showLog();
    
    t.calledWith(status, [500]);
    t.end();
});

test('error filter: returns 500 when exception is not an object', (t) => {
    const filter = new GlobalExceptionFilter();
    const {status, response} = createResponse();
    
    const {showLog} = hideLog();
    filter.catch('just a string', createHost(response));
    showLog();
    
    t.calledWith(status, [500]);
    t.end();
});

test('putout editor: server: exception: json: returns 500 when upstream error has neither response nor message', (t) => {
    const filter = new GlobalExceptionFilter();
    const {json, response} = createResponse();
    
    const {showLog} = hideLog();
    filter.catch({}, createHost(response));
    showLog();
    
    t.calledWith(json, ['Something went wrong']);
    t.end();
});

test('putout-editor: server: exception: filter: status: returns 500 when upstream error has neither response nor message', (t) => {
    const filter = new GlobalExceptionFilter();
    const {status, response} = createResponse();
    const {showLog} = hideLog();
    
    filter.catch({}, createHost(response));
    showLog();
    
    t.calledWith(status, [500]);
    t.end();
});

test('putout-editor: server: exception: filter: json: returns 500 when upstream error has neither response nor message', (t) => {
    const filter = new GlobalExceptionFilter();
    const {json, response} = createResponse();
    
    const {showLog} = hideLog();
    filter.catch({}, createHost(response));
    showLog();
    
    t.calledWith(json, ['Something went wrong']);
    t.end();
});

type MockResponse = {
    status(code: number): {
        json(body: unknown): void;
    };
};

function createResponse() {
    const json = stub();
    
    const status = stub<[
        number,
    ]>().returns({
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
    const http = {
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

const hideLog = () => {
    const original = console.error;
    
    console.error = noop;
    
    return {
        showLog: () => {
            console.error = original;
        },
    };
};
