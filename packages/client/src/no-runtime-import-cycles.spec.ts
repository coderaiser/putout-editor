import {
    readFileSync,
    readdirSync,
    statSync,
    existsSync,
} from 'node:fs';
import {
    join,
    dirname,
    resolve,
} from 'node:path';
import {test} from 'supertape';

// Absolute, so it matches what the specifier resolver below returns. Walking with
// relative paths and resolving to absolute silently produces a graph whose every
// target is outside it, and the walk then recurses until the stack overflows.
const ROOT = resolve('src');

const {imports: aliases} = JSON.parse(readFileSync('package.json', 'utf8'));

const walk = (dir: string): string[] => readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    
    return statSync(full).isDirectory() ? walk(full) : [full];
});

// Type-only edges are erased at runtime, so this used to skip them and only
// catch loops that actually load. It counts them now, which is what caught the
// types.ts / parser/contract.ts pair.
const EDGE = /(?:^|\n)\s*(?:import|export)\s+(type\s+)?[^'";]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*(?:\(\s*)?['"]([^'"]+)['"]/g;

const resolveSpecifier = (specifier: string, from: string) => {
    let base;
    
    if (specifier.startsWith('.')) {
        base = resolve(dirname(from), specifier);
    } else {
        const alias = aliases[specifier
            .split('/')
            .slice(0, 2)
            .join('/')];
        
        if (!alias)
            return null;
        
        base = resolve(alias);
    }
    
    for (const candidate of [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        join(base, 'index.ts'),
        join(base, 'index.tsx'),
    ])
        if (existsSync(candidate) && statSync(candidate).isFile())
            return candidate;
    
    return null;
};

const files = walk(ROOT);
const inTree = new Set(files);

const graph = new Map<string, string[]>(files.map((file) => {
    const source = readFileSync(file, 'utf8');
    const deps = new Set<string>();
    
    for (const [, , from, bare] of source.matchAll(EDGE)) {
        const target = resolveSpecifier(from || bare, file);
        
        // `import '../css/main.css'` and anything else outside src is not a node.
        if (target && inTree.has(target))
            deps.add(target);
    }
    
    return [file, [...deps]];
}));

// Tarjan, so a whole loop is reported as one group rather than one entry per back edge.
const cycles = (() => {
    const index = new Map<string, number>();
    const low = new Map<string, number>();
    const stack: string[] = [];
    const onStack = new Set<string>();
    const found: string[][] = [];
    let counter = 0;
    
    const visit = (node: string) => {
        index.set(node, counter);
        low.set(node, counter++);
        stack.push(node);
        onStack.add(node);
        
        for (const next of graph.get(node)!) {
            if (!index.has(next)) {
                visit(next);
                low.set(node, Math.min(low.get(node)!, low.get(next)!));
            } else if (onStack.has(next)) {
                low.set(node, Math.min(low.get(node)!, index.get(next)!));
            }
        }
        
        if (low.get(node) === index.get(node)) {
            const group: string[] = [];
            let member: string;
            
            do {
                member = stack.pop()!;
                onStack.delete(member);
                group.push(member);
            } while (member !== node);
            
            if (group.length > 1)
                found.push(
                    group
                        .sort()
                        .map((file) => file.slice(ROOT.length + 1)),
                );
        }
    };
    
    for (const file of files)
        if (!index.has(file))
            visit(file);
    
    return found;
})();

test('client: no import cycles', (t) => {
    const result = cycles;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});
