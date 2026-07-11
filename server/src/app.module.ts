import {Module} from '@nestjs/common';
import {AppController} from './app.controller.ts';
import {AppService} from './app.service.ts';
import {GistModule} from './gist/gist.module.ts';
import {ParseModule} from './parse/parse.module.ts';

@Module({
    imports: [GistModule, ParseModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
