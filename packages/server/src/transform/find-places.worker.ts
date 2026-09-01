import {createRequire} from 'node:module';
import {putoutAsync} from 'putout';
import {tryToCatch} from 'try-to-catch';
import {
    compilePlugin,
    structuredFromPutoutError,
} from './transform-error.ts';
import type {Place} from './transform.types.ts';

const require = createRequire(import.meta.url);

type WorkerInput = {
    fixture: string;
    plugin: string;
};
type WorkerResult = {
    places: Place[];
};

export default async function findPlaces({fixture, plugin}: WorkerInput): Promise<WorkerResult> {
    const [compileError, compiledRule] = compilePlugin(plugin, {
        require,
    });
    
    if (compileError)
        throw compileError;
    
    const [putoutError, result] = await tryToCatch(putoutAsync, fixture, {
        fix: false,
        plugins: [
            ['rule', compiledRule],
        ],
    });
    
    if (putoutError) {
        const structured = structuredFromPutoutError(putoutError);
        
        throw Object.assign(Error(putoutError.message), {
            structured,
        });
    }
    
    return {
        places: result.places,
    };
}
