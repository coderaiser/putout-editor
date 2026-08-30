import {Test} from '@nestjs/testing';
import {test, stub} from 'supertape';
import {TransformController} from './transform.controller.ts';
import {TransformService} from './transform.service.ts';

async function createController(mockTransformService: Record<string, unknown>) {
    const module = await Test
        .createTestingModule({
            controllers: [TransformController],
            providers: [{
                provide: TransformService,
                useValue: mockTransformService,
            }],
        })
        .compile();
    
    return module.get(TransformController);
}

test('transform controller: GET /api/v1/transform calls documentation', async (t) => {
    const mockService = {
        documentation: stub().returns({
            method: 'PUT',
        }),
        transform: stub(),
    };
    
    const controller = await createController(mockService);
    
    controller.getDocumentation();
    
    t.calledOnce(mockService.documentation);
    t.end();
});

test('transform controller: GET /api/v1/transform returns documentation object', async (t) => {
    const mockService = {
        documentation: stub().returns({
            method: 'PUT',
            url: '/api/v1/transform',
        }),
        transform: stub(),
    };
    
    const controller = await createController(mockService);
    const result = controller.getDocumentation();
    
    t.equal(result.method, 'PUT');
    t.end();
});

test('transform controller: PUT /api/v1/transform calls transform with body', async (t) => {
    const mockService = {
        documentation: stub(),
        transform: stub().resolves('const x = 1;'),
    };
    
    const controller = await createController(mockService);
    
    const body = {
        fixture: 'var x = 1;',
        plugin: 'export const replace = () => ({});',
    };
    
    await controller.transform(body);
    
    t.calledWith(mockService.transform, [body]);
    t.end();
});

test('transform controller: PUT /api/v1/transform returns transformed code', async (t) => {
    const mockService = {
        documentation: stub(),
        transform: stub().resolves('const x = 1;'),
    };
    
    const controller = await createController(mockService);
    
    const result = await controller.transform({
        fixture: 'var x = 1;',
        plugin: 'export const replace = () => ({});',
    });
    
    t.equal(result, 'const x = 1;');
    t.end();
});
