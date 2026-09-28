const nameOf = (path) => {
    const [, argument] = path.node.arguments;
    
    return argument.elements[0].value;
};

export const report = nameOf;

export const match = ({options}) => {
    const {known, seen = []} = options;
    
    return {
        'functionValue("var", __a)': ({}, path) => {
            const name = nameOf(path);
            
            if (known.includes(name) || seen.includes(name))
                return false;
            
            seen.push(name);
            
            return true;
        },
    };
};

export const replace = () => ({
    'functionValue("var", __a)': 'functionValue("var", __a)',
});
