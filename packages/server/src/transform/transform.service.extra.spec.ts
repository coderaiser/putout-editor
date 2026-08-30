import {test} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import runTransform from './transform.worker.ts';
import {TransformService} from './transform.service.ts';

type PoolWithRun = {
    run: (task: {
        fixture: string;
        plugin: string;
    }) => Promise<{code: string}>;
};

function createServiceWithRealWorker() {
    const service = new TransformService();
    
    (service as unknown as {
        pool: PoolWithRun;
    }).pool = {
        run: (task) => Promise.resolve(runTransform(task)),
    };
    
    return service;
}

const replaceVarWithConst = `
export const report = () => 'use const';
export const replace = () => ({
    'var __x = __y': 'const __x = __y',
});
`;

const removeDebugger = `
export const report = () => 'remove debugger';
export const traverse = () => ({
    'debugger'(path) {
        path.remove();
    },
});
`;

const reportOnly = `
export const report = () => 'unused variable';
export const traverse = () => ({});
`;

test('transform service: transform with traverse rule removes debugger', async (t) => {
    const service = createServiceWithRealWorker();
    const result = await service.transform({
        fixture: 'debugger;\nconst x = 1;',
        plugin: removeDebugger,
    });
    
    t.notOk(result.includes('debugger'));
    t.end();
});

test('transform service: transform with rule that reports but does not change code returns original', async (t) => {
    const service = createServiceWithRealWorker();
    const result = await service.transform({
        fixture: 'var x = 1;',
        plugin: reportOnly,
    });
    
    t.equal(result, 'var x = 1;');
    t.end();
});

test('transform service: transform handles empty fixture', async (t) => {
    const service = createServiceWithRealWorker();
    const result = await service.transform({
        fixture: '',
        plugin: replaceVarWithConst,
    });
    
    t.equal(result, '');
    t.end();
});

test('transform service: transform surfaces worker error as 422', async (t) => {
    const service = createServiceWithRealWorker();
    const [error] = await tryToCatch(service.transform.bind(service), {
        fixture: 'const x = 1;',
        plugin: 'export const = broken',
    });
    
    t.equal((error as Error & {
        status: number;
    }).status, 422);
    t.end();
});
