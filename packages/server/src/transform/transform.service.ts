import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
    Injectable,
    HttpException,
} from '@nestjs/common';
import {tryToCatch} from 'try-to-catch';
import Piscina from 'piscina';
import type {
    TransformRequest,
    TransformDocumentation,
    StructuredError,
} from './transform.types.ts';

type WorkerInput = {
    fixture: string;
    plugin: string;
};
type WorkerResult = {
    code: string;
};
type PiscinaPool = {
    run(task: WorkerInput): Promise<WorkerResult>;
};

const currentDirectory = dirname(fileURLToPath(import.meta.url));

type PiscinaConstructor = new (options: {
    filename: string;
    idleTimeout: number;
}) => PiscinaPool;

const createPool = (): PiscinaPool => new (Piscina as unknown as PiscinaConstructor)({
    filename: resolve(currentDirectory, './transform.worker.js'),
    idleTimeout: 5000,
});

@Injectable()
export class TransformService {
    private readonly pool: PiscinaPool = createPool();
    documentation(): TransformDocumentation {
        return {
            description: 'Apply a Putout plugin to a fixture and return the transformed code.',
            method: 'PUT',
            url: '/api/v1/transform',
            body: {
                fixture: 'var x = 1;',
                plugin: 'export const replace = () => ({ \'var __a\': \'const __a\' });',
            },
            response: 'const x = 1;',
            errors: {
                400: {
                    kind: 'plugin_syntax',
                    message: 'Your plugin is invalid JavaScript',
                    position: {line: 1, column: 13},
                },
                422: {
                    kind: 'plugin_error',
                    message: 'Plugin compiled but failed at runtime',
                },
            },
            links: {
                putout: 'https://github.com/coderaiser/putout',
                pluginDevelopment: 'https://github.com/coderaiser/putout/blob/master/docs/plugin-development.md',
                api: 'https://github.com/coderaiser/putout/blob/master/docs/API.md',
            },
            examples: [{
                name: 'replace var with const',
                plugin: 'export const replace = () => ({ \'var __a\': \'const __a\' });',
            }, {
                name: 'remove debugger',
                plugin: 'export const traverse = () => ({ debugger: (path) => path.remove() });',
            }, {
                name: 'report unused variable',
                plugin: 'export const report = () => \'Unexpected var\'; export const replace = () => ({ \'var __a\': \'const __a\' });',
            }],
        };
    }
    
    async transform({fixture, plugin}: TransformRequest): Promise<string> {
        const [error, result] = await tryToCatch(this.pool.run.bind(this.pool), {
            fixture,
            plugin,
        });
        
        if (error) {
            const structured = (error as {structured?: StructuredError}).structured;
            const status = structured?.kind === 'plugin_syntax' ? 400 : 422;
            const body = structured ?? {kind: 'plugin_error', message: error.message};
            throw new HttpException(body, status);
        }
        
        return result.code;
    }
}
