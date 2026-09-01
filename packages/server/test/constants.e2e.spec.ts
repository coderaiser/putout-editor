import {fork} from 'node:child_process';
import process from 'node:process';
import {test} from 'supertape';

test('constants: does not exit when AUTH_TOKEN is not set', async (t) => {
    const constantsPath = new URL('../src/constants.ts', import.meta.url).pathname;
    
    const child = fork(constantsPath, [], {
        execArgv: [
            '--import',
            '@supertape/loader-ts',
            '--enable-source-maps',
        ],
        env: {
            ...process.env,
            AUTH_TOKEN: '',
        },
        stdio: 'pipe',
    });
    
    const exitCode = await new Promise((resolve) => {
        child.on('close', (code) => {
            resolve(code);
        });
    });
    
    t.equal(exitCode, 0);
    t.end();
}, {
    timeout: 5000,
});
