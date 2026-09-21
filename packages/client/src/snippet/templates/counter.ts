import {montag} from 'montag';

export default montag`
    // count-words-by-star
    
    export const report = ({count}) => \`Found '\${count}' words 🧹\`;
    
    export const match = () => ({
        '*': (vars, path) => {
            const {__putout_processor_count} = path.node;
            
            if (__putout_processor_count)
                return {path, count: path.node.words};
            
            return false;
        },
    });
`;
