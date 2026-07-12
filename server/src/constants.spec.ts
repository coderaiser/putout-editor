import {fork} from 'node:child_process';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import process from 'node:process';
import {test} from 'supertape';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('constants: exits with code 1 when AUTH_TOKEN is not set', async (t) => {
    const constantsPath = new URL('constants.ts', import.meta.url).pathname;
    
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
    
    const [exitCode] = await new Promise((resolve) => {
        child.on('close', (code) => {
            resolve([code]);
        });
    });
    
    t.equal(exitCode, 0);
    t.end();
});
