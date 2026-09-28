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

export const report = (_, {message}) => message;

export const fix = (file) => file;

export const scan = (root, {push, trackFile}) => {
    for (const file of trackFile(root, MAIN).filter(isFile))
        if (!isImportsOnly(readFileContent(file) || ''))
            push(file, {
                message: `☝️ ${getFilename(file)}: ${MAIN} is an entry point: @import only`,
            });
};
