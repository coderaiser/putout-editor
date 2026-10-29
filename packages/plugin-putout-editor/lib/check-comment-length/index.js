const MAX_LINES = 8;

const countLines = (comments) => {
    const [first] = comments;
    const last = comments.at(-1);
    
    return last.loc.end.line - first.loc.start.line + 1;
};

const getGroups = (path) => {
    const {
        leadingComments = [],
        innerComments = [],
        trailingComments = [],
    } = path.node;
    
    const groups = [leadingComments, innerComments];
    
    if (!path.getNextSibling().node)
        groups.push(trailingComments);
    
    return groups;
};

const hasComments = (comments) => comments.length;

const getLongest = (path) => {
    const lengths = getGroups(path)
        .filter(hasComments)
        .map(countLines);
    
    return Math.max(0, ...lengths);
};

export const report = (path) => `Comment has ${getLongest(path)} lines: at most ${MAX_LINES}`;

export const fix = () => {};

export const include = () => [
    'Statement',
    'Expression',
    'ObjectMember',
    'SpreadElement',
    'ClassMethod',
    'ClassProperty',
    'TSTypeElement',
];

export const filter = (path) => getLongest(path) > MAX_LINES;
