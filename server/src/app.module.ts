import {resolve} from 'node:path';
import process from 'node:process';
import {Module} from '@nestjs/common';
import {ServeStaticModule} from '@nestjs/serve-static';
import {GistModule} from './gist/gist.module.ts';
import {ParseModule} from './parse/parse.module.ts';

// STATIC is resolved relative to the process working directory, matching
// how the npm "start" script invokes the app (`cd server && STATIC=../out
// node dist/main.js`), so the path resolves the same way regardless of
// whether the entry point lives at src/main.ts or dist/main.js.
const staticModules = process.env.STATIC ? [
    ServeStaticModule.forRoot({
        rootPath: resolve(process.cwd(), process.env.STATIC),
    }),
] : [];

export @Module({
    imports: [GistModule, ParseModule, ...staticModules],
})
class AppModule {}
