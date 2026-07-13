import {Test} from '@nestjs/testing';
import {test, stub} from 'supertape';
import {ParseController} from './parse.controller.ts';
import {ParseService} from './parse.service.ts';

test('parse controller: GET /api/v1/parse/:snippetid/:revisionid returns snippet', async (t) => {
    const mockParseService = {
        load: stub().resolves({
            revisionID: 0,
            snippetID: 's1',
        }),
    };
    
    const module = await Test
        .createTestingModule({
            controllers: [ParseController],
            providers: [{
                provide: ParseService,
                useValue: mockParseService,
            }],
        })
        .compile();
    
    const controller = module.get(ParseController);
    
    await controller.load('snippet1', 'latest');
    
    t.calledWith(mockParseService.load, ['snippet1', 'latest']);
    t.end();
});
