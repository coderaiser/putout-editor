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

const bareName = (file) => getFilename(file).replace(/^\//, '');

const isDoc = (file) => isFile(file) && DOCS.includes(bareName(file));

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
    try {
        return Object.keys(JSON.parse(content).scripts || {});
    } catch {
        return [];
    }
};

export const report = (_, {message}) => message;

export const fix = (file) => file;

export const scan = (root, {push, trackFile}) => {
    const filesOf = (mask) => Array.from(trackFile(root, mask));
    
    const [packageJson] = filesOf(PACKAGE).filter(isFile);
    const content = packageJson && readFileContent(packageJson);
    
    if (!content)
        return;
    
    const known = new Set(knownScripts(content));
    
    if (!known.size)
        return;
    
    for (const file of filesOf('*.md').filter(isDoc)) {
        const missing = Array
            .from(isCommand(readFileContent(file) || ''))
            .filter((script) => !known.has(script));
        
        if (missing.length)
            push(file, {
                message: `☝️ ${bareName(file)}: documents scripts that do not exist: ${missing.join(', ')}`,
            });
    }
};
