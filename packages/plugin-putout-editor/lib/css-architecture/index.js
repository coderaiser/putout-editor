import {operator} from 'putout';

const {
    readFileContent,
    getFilename,
    getFileType,
} = operator;

const MAIN = 'main.css';

const isFile = (file) => getFileType(file) === 'file';

const isImportsOnly = (content) => content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .every((line) => line.startsWith('@import'));

// main.css is an entry point: `@import` lines and nothing else — see
// packages/client/css/README.md. The claim is about a whole *file*, and a 🐊Putout rule
// sees one AST and knows nothing about filenames, so "only in this file" has to be a
// filesystem rule. Report-only: which file a rule belongs in is a judgement call, so the
// fix returns the file unchanged — the same trade as remove-rgb-outside-tokens.
export const report = (_, {message}) => message;

export const fix = (file) => file;

export const scan = (root, {push, trackFile}) => {
    for (const file of trackFile(root, MAIN).filter(isFile))
        if (!isImportsOnly(readFileContent(file) || ''))
            push(file, {
                message: `☝️ ${getFilename(file)}: ${MAIN} is an entry point: @import only`,
            });
};
