import {montag} from 'montag';

export default montag`
    // remove-files-without-tests
    
    import {operator} from 'putout';
    
    const {getFilename, getFileType} = operator;
    const isFile = (file) => getFileType(file) === 'file';
    const isSpec = (name) => name.includes('.spec.');
    
    export const report = ({name}) => \`No test found for '\${name}' 🔍\`;
    
    export const fix = () => {
        path.remove();
    };
    
    export const scan = (root, {push, trackFile}) => {
        const specs = new Set(
            files
                .map(getFilename)
                .filter(isSpec),
        );
        
        for (const file of trackFile(root, '*.js').filter(isFile)) {
            const name = getFilename(file);
            
            if (name.includes('.spec.'))
                continue;
            
            const expected = name.replace(/\\.js$/, '.spec.js');
            
            if (!specs.has(expected)) {
                push({
                    path: file,
                    name,
                });
            }
        }
    };
`;
