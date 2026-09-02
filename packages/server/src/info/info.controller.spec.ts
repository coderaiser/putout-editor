import {Test} from '@nestjs/testing';
import {test, stub} from 'supertape';
import {InfoController} from './info.controller.ts';
import {InfoService} from './info.service.ts';

async function createController(mockService: Record<string, unknown>) {
    const module = await Test
        .createTestingModule({
            controllers: [InfoController],
            providers: [{
                provide: InfoService,
                useValue: mockService,
            }],
        })
        .compile();
    
    return module.get(InfoController);
}

test('info controller: GET calls info on service', async (t) => {
    const mockService = {
        info: stub().returns({
            name: 'putout-editor API',
        }),
    };
    
    const controller = await createController(mockService);
    
    controller.getInfo();
    
    t.calledOnce(mockService.info);
    t.end();
});

test('info controller: GET returns info result', async (t) => {
    const mockService = {
        info: stub().returns({
            name: 'putout-editor API',
            workflow: [],
        }),
    };
    
    const controller = await createController(mockService);
    const result = controller.getInfo();
    
    t.equal(result.name, 'putout-editor API');
    t.end();
});
