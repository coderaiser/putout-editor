import {Test} from '@nestjs/testing';
import {ParseController} from '../src/parse/parse.controller.js';
import {ParseService} from '../src/parse/parse.service.js';
import {test, stub} from 'supertape';

test('parse controller: GET /api/v1/parse/:snippetid/:revisionid returns snippet', async (t) => {
    const mockParseService = {
        load: stub().resolves({revisionID: 0, snippetID: 's1'}),
    };
    
    const module = await Test.createTestingModule({
        controllers: [ParseController],
        providers: [
            {
                provide: ParseService,
                useValue: mockParseService,
            },
        ],
    }).compile();
    
    const controller = module.get(ParseController);
    const result = await controller.load('snippet1', 'latest');
    
    t.calledWith(mockParseService.load, ['snippet1', 'latest']);
    t.end();
});
