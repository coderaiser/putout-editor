import {basename, dirname} from 'node:path';
import {tryCatch} from 'try-catch';
import {operator} from 'putout';

const {
    readFileContent,
    getFilename,
    getFileType,
} = operator;

const PACKAGE = 'package.json';

const DOCS = [
    'AGENTS.md',
    'MEMORY.md',
];

const isFile = (file) => getFileType(file) === 'file';

const bareName = (file) => basename(getFilename(file));

const isDoc = (file) => isFile(file) && DOCS.includes(bareName(file));

const isPackage = (file) => isFile(file) && bareName(file) === PACKAGE;

const isPackageOf = (docs) => (file) => isPackage(file) && dirname(getFilename(file)) === dirname(getFilename(docs));

const CODE = /```[^`]*```|`[^`\n]*`/g;
const COMMAND = /(?:bun run|npm run|npx madrun|madrun) ([\w:][\w:-]*)/g;

const isCommand = (content) => {
    const scripts = new Set();
    
    for (const [code] of content.matchAll(CODE))
        for (const [, script] of code.matchAll(COMMAND))
            scripts.add(script);
    
    return scripts;
};

const knownScripts = (content) => {
    const [error, parsed] = tryCatch(JSON.parse, content);
    const {scripts = {}} = parsed || {};
    
    if (error)
        return [];
    
    return Object.keys(scripts || {});
};

const isMissing = (known) => (script) => !known.has(script);

export const report = (_, {message}) => message;

export const fix = (file) => file;

export const scan = (root, {crawlFile, push}) => {
    const files = crawlFile(root, [PACKAGE, ...DOCS]).filter(isFile);
    
    for (const file of files.filter(isDoc)) {
        const [packageJson] = files.filter(isPackageOf(file));
        const content = packageJson && readFileContent(packageJson);
        
        if (!content)
            continue;
        
        const known = new Set(knownScripts(content));
        
        if (!known.size)
            continue;
        
        const missing = Array
            .from(isCommand(readFileContent(file) || ''))
            .filter(isMissing(known));
        
        if (missing.length)
            push(file, {
                message: `☝️ ${bareName(file)}: documents scripts that do not exist: ${missing.join(', ')}`,
            });
    }
};
