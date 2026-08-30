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
        documentation: stub(),
        parseSource: stub(),
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

test('parse controller: GET /api/v1/parse returns documentation', async (t) => {
    const mockParseService = {
        load: stub(),
        documentation: stub().returns({
            method: 'PUT',
            url: '/api/v1/parse',
        }),
        parseSource: stub(),
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
    
    await controller.getDocumentation();
    
    t.calledOnce(mockParseService.documentation);
    t.end();
});

test('parse controller: PUT /api/v1/parse calls parseSource with source', async (t) => {
    const mockParseService = {
        load: stub(),
        documentation: stub(),
        parseSource: stub().resolves({
            type: 'File',
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
    
    await controller.parseSource({
        source: 'const x = 1;',
    });
    
    t.calledWith(mockParseService.parseSource, ['const x = 1;']);
    t.end();
});
