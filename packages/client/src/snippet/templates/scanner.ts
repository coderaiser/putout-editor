import {montag} from 'montag';

export default montag`
    // remove-spec
    
    import {operator} from 'putout';
    
    const {getFilename, getFileType} = operator;
    const isFile = (file) => getFileType(file) === 'file';
    const isSpec = (name) => name.includes('.spec.');
    
    export const report = ({name}) => \`No test found for '${name}' 🔍\`;
    
    export const fix = () => {
        path.remove();
    };
    
    export const scan = (root, {push, trackFile}) => {
        for (const file of trackFile(root, '*.js').filter(isFile)) {
            const name = getFilename(file);
            
            if (!isSpec(name))
                continue;
            
            push({
                path: file,
                name,
            });
        }
    };
`;
