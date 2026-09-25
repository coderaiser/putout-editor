import {montag} from 'montag';

export default montag`
    // convert-maintainer-to-label
    
    import {operator} from 'putout';
    
    const {__docker, setLiteralValue} = operator;
    
    export const report = () => \`Use LABEL instead of deprecated MAINTAINER 🐳\`;
    
    export const fix = ({path, arg}) => {
        setLiteralValue(path, 'LABEL');
        setLiteralValue(arg, \`org.opencontainers.image.authors=\${arg.node.value}\`);
    };
    
    export const traverse = ({push}) => ({
        [__docker]: (path) => {
            const instructions = path.get('arguments.0');
            
            for (const instr of instructions.get('elements')) {
                const [name, arg] = instr.get('elements');
                
                if (name.node.value === 'MAINTAINER')
                    push({
                        path: name,
                        arg,
                    });
            }
        },
    });
`;
