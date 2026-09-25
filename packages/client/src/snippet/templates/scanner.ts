import {montag} from 'montag';

export default montag`
    // remove-unused-files
    
    import {operator} from 'putout';
    
    const {getFilename, getFileType, removeFile} = operator;
    
    export const report = (file) => \`Remove unused file: '\${getFilename(file)}' 🗑️\`;
    
    export const fix = (file) => {
        removeFile(file);
    };
    
    export const scan = (root, {push, trackFile}) => {
        for (const file of trackFile(root, '*')) {
            if (getFileType(file) !== 'file')
                continue;
            
            if (getFilename(file).endsWith('/unused.js'))
                push(file);
        }
    };
`;
