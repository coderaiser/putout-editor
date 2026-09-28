import {branch} from '@putout/processor-css';
import {tryCatch} from 'try-catch';
import {
    parse,
    findPlaces,
    operator,
} from 'putout';
import * as checkToken from './check-token/index.js';

const {
    readFileContent,
    getFilename,
    getFileType,
} = operator;

const TOKENS = 'tokens.css';

const defined = (content) => {
    const names = [];
    
    for (const [, name] of content.matchAll(/(--[\dA-Za-z-]+)\s*:/g))
        names.push(name);
    
    return names;
};

const isFile = (file) => getFileType(file) === 'file';

const isStylesheet = (file) => isFile(file) && getFilename(file) !== TOKENS;

const missingOf = (content, known) => {
    const [error, places] = tryCatch(() => {
        const [place] = branch(content);
        
        return findPlaces(parse(place.source), {
            rules: {
                'check-token': ['on', {
                    known,
                }],
            },
            plugins: [
                ['check-token', checkToken],
            ],
        });
    });
    
    if (error)
        return [];
    
    return places.map(({message}) => message);
};

export const report = (_, {message}) => message;

export const fix = (file) => file;

export const scan = (root, {push, trackFile}) => {
    const [tokens] = trackFile(root, TOKENS).filter(isFile);
    
    if (!tokens)
        return;
    
    const known = defined(readFileContent(tokens) || '');
    
    for (const file of trackFile(root, '*.css').filter(isStylesheet)) {
        const missing = missingOf(readFileContent(file) || '', known);
        
        if (missing.length)
            push(file, {
                message: `☝️ ${getFilename(file)}: not in ${TOKENS}: ${missing.join(', ')}`,
            });
    }
};
