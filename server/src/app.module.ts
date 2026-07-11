import {Module} from '@nestjs/common';
import {AppController} from './app.controller.js';
import {AppService} from './app.service.js';
import {GistModule} from './gist/gist.module.js';
import {ParseModule} from './parse/parse.module.js';

@Module({
    imports: [GistModule, ParseModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
