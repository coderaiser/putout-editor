import {createRequire} from 'node:module';
import {compileRule} from 'redput/compile-rule';
import {putout} from 'putout';

const require = createRequire(import.meta.url);

type WorkerInput = {
    fixture: string;
    plugin: string;
};
type WorkerResult = {
    code: string;
};

export default function runTransform({fixture, plugin}: WorkerInput): WorkerResult {
    const compiledRule = compileRule(plugin, {
        require,
    });
    
    const {code} = putout(fixture, {
        fixCount: 1,
        plugins: [
            ['rule', compiledRule],
        ],
    });
    
    return {
        code: code.trimEnd(),
    };
}
