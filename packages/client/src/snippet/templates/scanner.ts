import {montag} from 'montag';

export default montag`
    // find-files-without-tests
    
    import {operator} from 'putout';
    
    const {getFilename, getFileType} = operator;
    
    export const report = ({name}) => \`No test found for '\${name}' 🔍\`;
    
    export const fix = () => {};
    
    export const scan = (root, {push, trackFile}) => {
        const files = [...trackFile(root, '*.js')]
            .filter((file) => getFileType(file) === 'file');
        const specs = new Set(
            files
                .map((file) => getFilename(file))
                .filter((name) => name.includes('.spec.')),
        );
        
        for (const file of files) {
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
