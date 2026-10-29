import {resolve} from 'node:path';
import process from 'node:process';
import {Module} from '@nestjs/common';
import {ServeStaticModule} from '@nestjs/serve-static';
import {GistModule} from './gist/gist.module.ts';
import {ParseModule} from './parse/parse.module.ts';
import {TransformModule} from './transform/transform.module.ts';
import {InfoModule} from './info/info.module.ts';

/*
 * A path that names a file is an asset: a missing one is a 404, not `index.html`.
 * Other unmatched GETs go to the editor, which has no router.
 * `[^\s/]`, not `\w`: hashed asset names have a hyphen (`runtime-48359543fd44e134-26.js`).
 */
const ASSET = /\/[^\s/]*\.[^\s/]+$/;

/** Whether the static fallback must be skipped, so the request can 404. */
export const isAsset = (url: string): boolean => ASSET.test(url);

export function getStaticModules() {
    return process.env.STATIC
        ? [
            ServeStaticModule.forRoot({
                rootPath: resolve(process.cwd(), process.env.STATIC),
                exclude: ASSET,
            }),
        ]
        : [];
}

@Module({
    imports: [
        GistModule,
        ParseModule,
        TransformModule,
        InfoModule,
        ...getStaticModules(),
    ],
})
export class AppModule {}
