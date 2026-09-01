import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Injectable, HttpException} from '@nestjs/common';
import {tryToCatch} from 'try-to-catch';
import Piscina from 'piscina';
import type {
    TransformRequest,
    Place,
    StructuredError,
} from './transform.types.ts';

type WorkerResult = {
    places: Place[];
};
type PiscinaPool = {
    run(task: TransformRequest): Promise<WorkerResult>;
};
type PiscinaConstructor = new (options: {
    filename: string;
    idleTimeout: number;
}) => PiscinaPool;

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const createPool = (): PiscinaPool => new (Piscina as unknown as PiscinaConstructor)({
    filename: resolve(currentDirectory, './find-places.worker.js'),
    idleTimeout: 5000,
});

@Injectable()
export class FindPlacesService {
    private readonly pool: PiscinaPool = createPool();
    documentation() {
        return {
            description: 'Find all places in source code where a putout plugin matches, without modifying the code. Use this to iterate on a plugin: check what it detects and where before applying transforms.',
            method: 'PUT',
            url: '/api/v1/find-places',
            body: {
                fixture: 'var x = 1;\nvar y = 2;',
                plugin: 'export const report = () => \'use const\';\nexport const replace = () => ({ \'var __x = __y\': \'const __x = __y\' });',
            },
            response: {
                places: [{
                    rule: 'rule',
                    message: 'use const',
                    position: {
                        line: 1,
                        column: 0,
                    },
                }],
            },
            errors: {
                400: {
                    kind: 'plugin_syntax',
                    message: 'Unexpected token (1:13)',
                    position: {
                        line: 1,
                        column: 13,
                    },
                },
                422: {
                    kind: 'plugin_error',
                    message: '☝️ Looks like \'report\' is not a \'function\'',
                },
            },
            links: {
                putoutAPI: 'https://github.com/coderaiser/putout/blob/master/README.md#putoutsource-options',
                pluginDevelopment: 'https://github.com/coderaiser/putout/blob/master/docs/plugin-development.md',
                putoutScript: 'https://github.com/coderaiser/putout/blob/master/docs/putout-script.md',
                compare: 'https://github.com/coderaiser/putout/tree/master/packages/compare#readme',
            },
            workflow: 'Typical iteration: PUT /api/v1/find-places to check matches → refine plugin → repeat → PUT /api/v1/transform to apply',
        };
    }
    
    async findPlaces(request: TransformRequest): Promise<{places: Place[]}> {
        const [error, result] = await tryToCatch(this.pool.run.bind(this.pool), request);
        
        if (error) {
            const {structured} = error as {
                structured?: StructuredError;
            };
            
            const status = structured?.kind === 'plugin_syntax' ? 400 : 422;
            
            const body = structured || {
                kind: 'plugin_error',
                message: error.message,
            };
            
            throw new HttpException(body, status);
        }
        
        return result;
    }
}
