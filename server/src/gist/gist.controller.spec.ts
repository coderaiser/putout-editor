import {Test} from '@nestjs/testing';
import {test, stub} from 'supertape';
import {GistController} from './gist.controller.ts';
import {GistService} from './gist.service.ts';

test('gist controller: POST /api/v1/gist (create)', async (t) => {
    const mockGistService = {
        create: stub().resolves({
            id: 'new-gist',
        }),
    };
    
    const module = await Test
        .createTestingModule({
            controllers: [GistController],
            providers: [{
                provide: GistService,
                useValue: mockGistService,
            }],
        })
        .compile();
    
    const controller = module.get(GistController);
    
    const body = {
        code: 'test',
        filename: 'test.js',
        parserID: 'babel',
        toolID: 'putout',
        settings: {},
        versions: {},
    };
    
    await controller.create(body);
    
    t.calledWith(mockGistService.create, [body]);
    t.end();
});

test('gist controller: PATCH /api/v1/gist/:id (update)', async (t) => {
    const mockGistService = {
        update: stub().resolves({
            id: 'updated-gist',
        }),
    };
    
    const module = await Test
        .createTestingModule({
            controllers: [GistController],
            providers: [{
                provide: GistService,
                useValue: mockGistService,
            }],
        })
        .compile();
    
    const controller = module.get(GistController);
    
    const body = {
        code: 'updated',
        filename: 'test.js',
        parserID: 'babel',
        toolID: 'putout',
        settings: {},
        versions: {},
    };
    
    await controller.update('gist123', body);
    
    t.calledWith(mockGistService.update, ['gist123', body]);
    t.end();
});

test('gist controller: POST /api/v1/gist/:id/:revision (fork)', async (t) => {
    const mockGistService = {
        fork: stub().resolves({
            id: 'forked-gist',
        }),
    };
    
    const module = await Test
        .createTestingModule({
            controllers: [GistController],
            providers: [{
                provide: GistService,
                useValue: mockGistService,
            }],
        })
        .compile();
    
    const controller = module.get(GistController);
    
    const body = {
        code: 'forked',
        filename: 'test.js',
        parserID: 'babel',
        toolID: 'putout',
        settings: {},
        versions: {},
    };
    
    await controller.fork('gist123', 'rev1', body);
    
    t.calledWith(mockGistService.fork, [body]);
    t.end();
});

test('gist controller: GET /api/v1/gist/:id/:revision (load)', async (t) => {
    const mockGistService = {
        load: stub().resolves({
            id: 'gist123',
        }),
    };
    
    const module = await Test
        .createTestingModule({
            controllers: [GistController],
            providers: [{
                provide: GistService,
                useValue: mockGistService,
            }],
        })
        .compile();
    
    const controller = module.get(GistController);
    
    await controller.load('gist123', 'rev1');
    
    t.calledWith(mockGistService.load, ['gist123', 'rev1']);
    t.end();
});
