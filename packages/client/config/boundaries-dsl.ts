type ElementType = string;

type BoundaryMap = Record<ElementType, ElementType[]>;

type RawElement = {
    type: ElementType;
    pattern: string;
};

type RawPolicy = {
    from: {element: {type: ElementType}};
    allow: {to: {element: {type: ElementType}}}[];
};

type BoundariesConfig = {
    'boundaries/elements': RawElement[];
    'boundaries/dependencies': [string, {
        default: string;
        policies: RawPolicy[];
    }];
};

function expandGlob(pattern: ElementType, knownTypes: ElementType[]): ElementType[] {
    if (pattern === '*')
        return [pattern];
    
    if (pattern.endsWith('-*')) {
        const prefix = pattern.slice(0, -1);
        const matches = knownTypes.filter((t) => t.startsWith(prefix));
        
        return matches.length ? matches : [pattern];
    }
    
    return [pattern];
}

export function buildBoundaries(map: BoundaryMap): BoundariesConfig {
    const knownTypes = Object.keys(map);
    
    const elements: RawElement[] = knownTypes.map((type) => ({
        type,
        pattern: `src/${type}/**`,
    }));
    
    const policies: RawPolicy[] = knownTypes.map((from) => {
        const targets = map[from].flatMap((target) =>
            expandGlob(target, knownTypes),
        );
        
        return {
            from: {element: {type: from}},
            allow: targets.map((type) => ({to: {element: {type}}})),
        };
    });
    
    return {
        'boundaries/elements': elements,
        'boundaries/dependencies': ['error', {
            default: 'disallow',
            policies,
        }],
    };
}