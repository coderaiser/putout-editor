import {readFileSync} from 'node:fs';
import process from 'node:process';
import {Module} from '@nestjs/common';
import {ParseController} from './parse.controller.ts';
import {ParseService} from './parse.service.ts';
import type {
    Snippet,
    SnippetRevision,
} from './parse.types.ts';

function prepareData<T extends {
    _id: string;
}>(filePath: string): Map<string, T> {
    const data: T[] = JSON.parse(readFileSync(filePath, 'utf8'));
    const map = new Map<string, T>();
    
    for (const obj of data)
        map.set(obj._id, obj);
    
    return map;
}

@Module({
    controllers: [ParseController],
    providers: [
        ParseService, {
            provide: 'SNIPPETS',
            useFactory: () => {
                if (process.env.SNIPPET_FILE)
                    return prepareData<Snippet>(process.env.SNIPPET_FILE);
                
                return new Map<string, Snippet>();
            },
        }, {
            provide: 'SNIPPET_REVISIONS',
            useFactory: () => {
                if (process.env.REVISION_FILE)
                    return prepareData<SnippetRevision>(process.env.REVISION_FILE);
                
                return new Map<string, SnippetRevision>();
            },
        },
    ],
    exports: [],
})
export class ParseModule {}
