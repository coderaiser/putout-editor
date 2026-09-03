import {Test} from '@nestjs/testing';
import {test, stub} from 'supertape';
import {LlmsController} from './llms.controller.ts';
import {LlmsService} from './llms.service.ts';

const makeRes = () => ({
    send: stub(),
});

async function createController(mockService: Record<string, unknown>) {
    const module = await Test
        .createTestingModule({
            controllers: [LlmsController],
            providers: [{
                provide: LlmsService,
                useValue: mockService,
            }],
        })
        .compile();
    
    return module.get(LlmsController);
}

test('llms controller: GET /llms.txt calls llmsTxt on service', async (t) => {
    const mockService = {
        llmsTxt: stub().returns('# putout-editor'),
        llmsFullTxt: stub().returns(''),
    };
    const controller = await createController(mockService);
    
    controller.getLlmsTxt(makeRes() as never);
    
    t.calledOnce(mockService.llmsTxt);
    t.end();
});

test('llms controller: GET /llms.txt sends service result', async (t) => {
    const mockService = {
        llmsTxt: stub().returns('# putout-editor'),
        llmsFullTxt: stub().returns(''),
    };
    const controller = await createController(mockService);
    const res = makeRes();
    
    controller.getLlmsTxt(res as never);
    
    t.calledWith(res.send, ['# putout-editor']);
    t.end();
});

test('llms controller: GET /llms-full.txt calls llmsFullTxt on service', async (t) => {
    const mockService = {
        llmsTxt: stub().returns(''),
        llmsFullTxt: stub().returns('# full'),
    };
    const controller = await createController(mockService);
    
    controller.getLlmsFullTxt(makeRes() as never);
    
    t.calledOnce(mockService.llmsFullTxt);
    t.end();
});

test('llms controller: GET /llms-full.txt sends service result', async (t) => {
    const mockService = {
        llmsTxt: stub().returns(''),
        llmsFullTxt: stub().returns('# full'),
    };
    const controller = await createController(mockService);
    const res = makeRes();
    
    controller.getLlmsFullTxt(res as never);
    
    t.calledWith(res.send, ['# full']);
    t.end();
});
