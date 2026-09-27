import {readdirSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import process, {stdout, stderr} from 'node:process';

const lib = fileURLToPath(new URL('..', import.meta.url) + 'lib');

const sources = readdirSync(lib, {
    recursive: true,
}).filter((name) => name.endsWith('.js'));

const offenders = sources.filter((name) => {
    const source = readFileSync(join(lib, name), 'utf8');
    
    return /(^|\s)\/\//.test(source);
});

if (offenders.length) {
    stderr.write(`☝️ a rule says what the code already says: ${offenders.join(', ')}\n`);
    process.exit(1);
}

stdout.write('✔ no comments in lib\n');
