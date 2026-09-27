// Generates the client import graph in docs/architecture.md from packages/client/config/boundaries-config.ts, and checks it. Only the `A --> B` lines are generated: the node declarations, labels and `style` lines stay hand-written, because those are prose and do not drift. `app` is the one deliberate simplification — its policy is `['*']` and it is drawn with the six elements it really uses. The check is the gate, the generator a convenience: a generator nothing verifies is a script nobody runs, and the diagram was a second hand-kept statement of a policy `boundaries/dependencies` already enforces. The first run found three edges the policy has always allowed and the diagram never drew. `process.stderr` rather than `console`, because `remove-console` is on at the root and a gate that exits 1 without saying why is worse than no gate.
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import process from 'node:process';
import {createJiti} from 'jiti';

const ROOT = new URL('..', import.meta.url);
const DOC = fileURLToPath(new URL('docs/architecture.md', ROOT));
const CONFIG = fileURLToPath(new URL('packages/client/config/boundaries-config.ts', ROOT));

const OPEN = '<!-- gen:client-imports -->';
const CLOSE = '<!-- /gen:client-imports -->';

const say = (message) => process.stderr.write(`${message}\n`);

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// `panel-source` -> `panelSource`: mermaid ids cannot carry a dash.
const idOf = (element) => element.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

// The same glob `boundaries-dsl.ts` expands, so the diagram shows what the lint sees rather than re-implementing the policy over literals.
const expand = (pattern, known) => {
    if (pattern === '*')
        return ['*'];
    
    if (pattern.endsWith('-*')) {
        const prefix = pattern.slice(0, -1);
        const matches = known.filter((element) => element.startsWith(prefix));
        
        return matches.length ? matches : [pattern];
    }
    
    return [pattern];
};

const edgesOf = (map) => {
    const known = Object.keys(map);
    const edges = [];
    
    for (const [from, targets] of Object.entries(map)) {
        if (from === 'app')
            continue;
        
        for (const target of targets.flatMap((pattern) => expand(pattern, known))) {
            if (target === '*')
                continue;
            
            edges.push(`${idOf(from)} --> ${idOf(target)}`);
        }
    }
    
    return edges;
};

// `app` is `['*']`, so the map has no edges for it. These are the six it really uses, which is the one hand-maintained part of the block and the reason the doc explains it below the diagram.
const APP_USES = [
    'layout',
    'menu',
    'panel-source',
    'panel-ast',
    'panel-transform',
    'panel-code',
];

const block = (map) => {
    const app = [];
    
    for (const element of APP_USES)
        app.push(`app --> ${idOf(element)}`);
    
    const lines = [...app, '', ...edgesOf(map)];
    
    // indented like the node declarations above it, and grouped by element rather than drawn top-down: the order comes from the map, which is the point.
    for (const [index, line] of lines.entries()) {
        if (line)
            lines[index] = `    ${line}`;
    }
    
    return lines.join('\n');
};

const main = async () => {
    const jiti = createJiti(fileURLToPath(ROOT));
    const {map} = await jiti.import(CONFIG);
    const generated = block(map);
    const source = readFileSync(DOC, 'utf8');
    
    // Anchored to the start of a line, and the prose below the diagram talks *about* these markers by name - a bare indexOf finds that mention first, and the check then compares the wrong two regions of the file.
    const open = RegExp(`^${escape(OPEN)}$`, 'm');
    const close = RegExp(`^${escape(CLOSE)}$`, 'm');
    
    const from = source.search(open);
    const to = source.search(close);
    
    if (from === -1 || to === -1)
        throw Error(`docs/architecture.md has no ${OPEN} .. ${CLOSE} block`);
    
    const head = source.slice(0, from + OPEN.length);
    const tail = source.slice(to);
    
    // Only the blank lines *around* the block are formatting, not content - so strip newlines, not whitespace: a plain trim() eats the indent on the first and last line and then reports the file stale forever.
    const current = source
        .slice(from + OPEN.length, to)
        .replace(/^\n+|\n+$/g, '');
    
    const updated = `${head}\n\n${generated}\n\n${tail}`;
    
    if (process.argv.includes('--check')) {
        if (current === generated) {
            say('docs/architecture.md is up to date');
            return;
        }
        
        say('docs/architecture.md is stale: the client import graph does not match config/boundaries-config.ts');
        say('run: node scripts/gen-diagrams.mjs');
        process.exit(1);
    }
    
    writeFileSync(DOC, updated);
    say('docs/architecture.md updated');
};

await main();
