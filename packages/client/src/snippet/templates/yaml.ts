import {montag} from 'montag';

export default montag`
    // remove-empty-needs
    
    import {operator} from 'putout';
    
    const {__yaml, getTemplateValues, traverseProperties, remove} = operator;
    
    export const report = () => \`Remove empty 'needs: []' from GitHub Actions 🐙\`;
    
    export const fix = (path) => {
        remove(path);
    };
    
    export const traverse = ({push}) => ({
        [__yaml]: (path) => {
            const {__object} = getTemplateValues(path, __yaml);
            const [needsPath] = traverseProperties(__object, 'needs');
            
            if (!needsPath)
                return;
            
            if (needsPath.get('value').node.elements.length)
                return;
            
            push(needsPath);
        },
    });
`;
