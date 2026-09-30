type ElementType = string;
type BoundaryMap = Record<ElementType, ElementType[]>;
type RawElement = {
    type: ElementType;
    pattern: string;
};
type RawPolicy = {
    from: {
        element: {
            type: ElementType;
        };
    };
    allow: {
        to: {
            element: {
                type: ElementType;
            };
        };
    }[];
};
type BoundariesConfig = {
    'boundaries/elements': RawElement[];
    'boundaries/dependencies': [string, {
        default: string;
        policies: RawPolicy[];
    }];
};

const byPrefix = (prefix: ElementType) => (type: ElementType) => type.startsWith(prefix);

const expanding = (knownTypes: ElementType[]) => (pattern: ElementType) => expandGlob(pattern, knownTypes);

const asAllowed = (type: ElementType): RawPolicy['allow'][number] => ({
    to: {
        element: {
            type,
        },
    },
});

function expandGlob(pattern: ElementType, knownTypes: ElementType[]): ElementType[] {
    if (pattern === '*')
        return [pattern];
    
    if (pattern.endsWith('-*')) {
        const prefix = pattern.slice(0, -1);
        const matches = knownTypes.filter(byPrefix(prefix));
        
        return matches.length ? matches : [pattern];
    }
    
    return [pattern];
}

export function buildBoundaries(map: BoundaryMap): BoundariesConfig {
    const knownTypes = Object.keys(map);
    const elements: RawElement[] = [];
    
    for (const type of knownTypes) {
        elements.push({
            type,
            pattern: `src/${type}/**`,
        });
    }
    
    const policies: RawPolicy[] = [];
    
    for (const from of knownTypes) {
        const targets = map[from].flatMap(expanding(knownTypes));
        
        policies.push({
            from: {
                element: {
                    type: from,
                },
            },
            allow: targets.map(asAllowed),
        });
    }
    
    return {
        'boundaries/elements': elements,
        'boundaries/dependencies': ['error', {
            default: 'disallow',
            policies,
        }],
    };
}
