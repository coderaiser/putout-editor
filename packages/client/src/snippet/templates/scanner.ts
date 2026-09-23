import {montag} from 'montag';

export default montag`
    // remove-unused-files
    
    import {operator} from 'putout';
    
    const {removeFile} = operator;
    
    export const report = ({filename}) => \`Remove unused file: '\${filename}' 🗑️\`;
    
    export const fix = ({filename}) => {
        removeFile(filename);
    };
    
    export const scan = (root, {push, trackFile}) => {
        const {files} = root;
        const {imports} = files;
        
        for (const file of trackFile(root)) {
            const {filename} = file;
            
            if (imports.includes(filename))
                continue;
            
            push({
                filename,
            });
        }
    };
`;
