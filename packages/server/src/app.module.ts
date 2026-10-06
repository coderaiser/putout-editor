import {resolve} from 'node:path';
import process from 'node:process';
import {Module} from '@nestjs/common';
import {ServeStaticModule} from '@nestjs/serve-static';
import {GistModule} from './gist/gist.module.ts';
import {ParseModule} from './parse/parse.module.ts';
import {TransformModule} from './transform/transform.module.ts';
import {InfoModule} from './info/info.module.ts';

// Anything that names a file is a request for an asset, not a route, and a
// missing one has to be a 404. Without this the module registers its fallback
// as `app.get('{*any}')`, which answers **every** unmatched GET with
// `index.html` and a 200 — so `/chat.html` returned the editor's page, and a
// mistyped `.js` returned HTML that the browser then refused to execute as a
// script.
//
// The fallback itself is wanted: it is what makes an unmatched route reach the
// editor rather than a 404, and the editor has no router of its own. It is only
// wrong for a path that names a file.
//
// `[^\s/]` rather than `\w`, because every hashed asset name in this build has
// a hyphen in it (`runtime-48359543fd44e134-26.js`) and `\w` does not match one.
// A `\w` guard here would leave every real filename still being answered with
// the page.
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
