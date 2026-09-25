import {montag} from 'montag';

export default montag`
    // remove-empty-dependencies
    
    import {operator} from 'putout';
    
    const {__toml, getTemplateValues, traverseProperties, remove} = operator;
    
    export const report = () => \`Remove empty 'dependencies' table from TOML 📦\`;
    
    export const fix = (path) => {
        remove(path);
    };
    
    export const traverse = ({push}) => ({
        [__toml]: (path) => {
            const {__object} = getTemplateValues(path, __toml);
            const [depsPath] = traverseProperties(__object, 'dependencies');
            
            if (!depsPath)
                return;
            
            if (depsPath.get('value').node.properties.length)
                return;
            
            push(depsPath);
        },
    });
`;
