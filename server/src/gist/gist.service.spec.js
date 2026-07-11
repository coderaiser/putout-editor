import {Test} from '@nestjs/testing';
import {GistService} from './gist.service.js';
import {GithubService} from './github.service.js';
import {test, stub} from 'supertape';

test('gist service: load', async (t) => {
    const mockGithub = {
        load: stub().resolves({id: 'gist123', files: {}}),
    };
    
    const module = await Test.createTestingModule({
        providers: [
            GistService,
            {
                provide: GithubService,
                useValue: mockGithub,
            },
        ],
    }).compile();
    
    const service = module.get(GistService);
    const result = await service.load('gist123', 'rev1');
    
    t.calledWith(mockGithub.load, ['gist123', 'rev1']);
    t.end();
});

test('gist service: create', async (t) => {
    const mockGithub = {
        create: stub().resolves({id: 'gist456'}),
    };
    
    const module = await Test.createTestingModule({
        providers: [
            GistService,
            {
                provide: GithubService,
                useValue: mockGithub,
            },
        ],
    }).compile();
    
    const service = module.get(GistService);
    const result = await service.create({files: []});
    
    t.calledWith(mockGithub.create, [{files: []}]);
    t.end();
});

test('gist service: update', async (t) => {
    const mockGithub = {
        update: stub().resolves({id: 'gist789'}),
    };
    
    const module = await Test.createTestingModule({
        providers: [
            GistService,
            {
                provide: GithubService,
                useValue: mockGithub,
            },
        ],
    }).compile();
    
    const service = module.get(GistService);
    const result = await service.update('gist789', {files: []});
    
    t.calledWith(mockGithub.update, ['gist789', {files: []}]);
    t.end();
});

test('gist service: fork', async (t) => {
    const mockGithub = {
        create: stub().resolves({id: 'forked123'}),
    };
    
    const module = await Test.createTestingModule({
        providers: [
            GistService,
            {
                provide: GithubService,
                useValue: mockGithub,
            },
        ],
    }).compile();
    
    const service = module.get(GistService);
    const result = await service.fork({files: []});
    
    t.calledWith(mockGithub.create, [{files: []}]);
    t.end();
});
