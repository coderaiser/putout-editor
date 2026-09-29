const hasLength = (a) => a && a.length;

export const report = () => 'A rule says what the code already says';

export const fix = ({node}) => {
    node.leadingComments = [];
    node.trailingComments = [];
    node.innerComments = [];
};

export const include = () => [
    'Statement',
    'Expression',
    'ObjectProperty',
];

export const filter = ({node}) => {
    const {
        leadingComments,
        trailingComments,
        innerComments,
    } = node;
    
    if (hasLength(leadingComments))
        return true;
    
    if (hasLength(trailingComments))
        return true;
    
    return hasLength(innerComments);
};
