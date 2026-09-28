import {operator} from 'putout';

const {
    readFileContent,
    getFilename,
    getFileType,
} = operator;

const TOKENS = 'tokens.css';

const defined = (content) => {
    const names = new Set();
    
    for (const [, name] of content.matchAll(/(--[\dA-Za-z-]+)\s*:/g))
        names.add(name);
    
    return names;
};

const used = (content) => {
    const names = [];
    
    for (const [, name] of content.matchAll(/var\((--[\dA-Za-z-]+)/g))
        if (!names.includes(name))
            names.push(name);
    
    return names;
};

const isFile = (file) => getFileType(file) === 'file';

export const report = (_, {message}) => message;

export const fix = (file) => file;

export const scan = (root, {push, trackFile}) => {
    const isStylesheet = (file) => isFile(file) && getFilename(file) !== TOKENS;
    
    const [tokens] = trackFile(root, TOKENS).filter(isFile);
    
    if (!tokens)
        return;
    
    const known = defined(readFileContent(tokens) || '');
    
    for (const file of trackFile(root, '*.css').filter(isStylesheet)) {
        const missing = used(readFileContent(file) || '').filter((name) => !known.has(name));
        
        if (missing.length)
            push(file, {
                message: `☝️ ${getFilename(file)}: not in ${TOKENS}: ${missing.join(', ')}`,
            });
    }
};
