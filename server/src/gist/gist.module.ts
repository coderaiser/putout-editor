import {Module} from '@nestjs/common';
import {Octokit} from '@octokit/rest';
import {GistController} from './gist.controller.js';
import {GistService} from './gist.service.js';
import {GithubService} from './github.service.js';
import {AUTH_TOKEN} from '../constants.js';

@Module({
    controllers: [GistController],
    providers: [
        GistService,
        GithubService,
        {
            provide: 'OCTOKIT',
            useFactory: () => new Octokit({
                auth: AUTH_TOKEN,
            }),
        },
    ],
    exports: [],
})
export class GistModule {}

