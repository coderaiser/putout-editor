import {z} from 'zod';
import {tryCatch} from 'try-catch';
import {montag} from 'montag';
import {parse, type types} from 'putout';

export const name = 'flatlint_rule';

export const description =
    'Write a flatlint rule — a token-level linter that fixes syntax errors, ' +
    'shaped exactly like a putout plugin: `report` first, then a `replace` map of ' +
    'PutoutScript keys, and an OPTIONAL `match` map keyed by the SAME replace keys. ' +
    'A match fn is `(vars, path) => boolean`, and returning false skips that ' +
    'occurrence entirely — no fix AND no report. flatlint has no AST, so a rule ' +
    'works on a file that does not parse. ' +
    'Call {action: "contract"} for the full shape including `path`, the test ' +
    'harness and the fixture layout; pass `pattern` to get the rule, fixture and ' +
    'spec generated; pass `rule` to have one checked — a missing `report`, and a ' +
    '`match` key that is absent from `replace` (which flatlint silently ignores, ' +
    'so the guard does nothing) are both reported.';

/**
 * What a flatlint plugin is, in one object.
 *
 * `{report, match?, replace}` — the pair `packages/plugin-putout-editor` exports
 * plus an **optional** `match`. `replace` decides *what* matches; `match` only
 * decides *whether to act* on an occurrence that already matched. Same contract
 * putout uses, one unit lighter: a guard is looked up in the `match` map by the
 * very `replace` key it guards.
 */
const CONTRACT = montag`
A flatlint plugin, in full:
    
    import {isIdentifier} from '#types';
    
    export const report = () => \`Add missing '=>'\`;
    
    export const match = () => ({
        '(__args) {': (vars, path) => !isIdentifier(path.getPrev()),
    });
    export const replace = () => ({
        '(__args) {': '(__args) => {',
    });

\`report\` first, as in every rule in this repo. \`match\` is OPTIONAL — 19 of the 33
shipped plugins have none — and when present it is keyed by the SAME key it
guards. A \`match\` key absent from \`replace\` is DEAD: the runner looks the guard up
by the replace key, so that guard is never called and the rule fires anyway.

A match fn is \`(vars, path) => boolean\`. Returning false skips that occurrence
ENTIRELY — no fix and no report — which is how you exclude a shape the token
pattern cannot express on its own. \`vars\` holds the \`__a\`/\`__b\` bindings the key
declared, and \`path\` is a TOKEN path, not a NodePath: there is no AST and no
\`parentPath\`. Its 22 methods are getPrev, getAllPrev, getAllNext, isPrevKeyword,
isNextKeyword, isPrevIdentifier, isNextIdentifier, isPrevPunctuator,
isNextPunctuator, isCurrentPunctuator, isPrevDeclarationKeyword,
isPrevAnyDeclarationKeyword, isNextCompare, isNextCompareAll,
isNextDeclarationKeyword, isNextTemplateHead, isNextTemplateTail,
isInsideTemplate, isPrevInvalid and isNext. Punctuators are the \`#types\`
constants (\`closeRoundBrace\`, \`colon\`, \`assign\`), never bare strings.

The directory:
    
    lib/plugins/<rule-name>/
    ├── fixture/
    │   ├── <case>.js        the shape, unfixed
    │   └── <case>-fix.js    the expected output
    ├── index.js
    └── index.spec.js

And the spec, which is a @putout/test spec — flatlint swaps only \`lint\`:
    
    import {createTest} from '#test';
    import * as plugin from '#plugin-<rule-name>';
    
    const test = createTest(import.meta.url, {
        plugins: [
            ['<rule-name>', plugin],
        ],
    });
    
    test('flatlint: <rule-name>: report', (t) => {
        t.report('<rule-name>', \`the message\`);
        t.end();
    });
    
    test('flatlint: <rule-name>: transform', (t) => {
        t.transform('<case>');
        t.end();
    });

\`t.transform\` is named after the FIXTURE, not the rule. \`t.noReport('<case>')\`
is how you prove a \`match\` guard holds — and a fixture it must NOT touch is the
only proof there is, because a guard that never fires and no guard at all produce
the same green test.`.replace(/[ \t]+$/gm, '');

export const schema = z.object({
    action: z
        .enum(['contract', 'build', 'check'])
        .optional()
        .describe('"contract" for the shape, "build" (default with a pattern) to generate, "check" to validate'),
    pattern: z
        .string()
        .optional()
        .describe('The PutoutScript key, e.g. "import __a = from \'__b\'"'),
    to: z
        .string()
        .optional()
        .describe('The replacement for that key. Omit to scaffold with a TODO'),
    rule: z
        .string()
        .optional()
        .describe('The plugin source to check, instead of a pattern'),
    name: z
        .string()
        .optional()
        .describe('The rule name, used for the directory and the spec titles'),
});

export type Schema = z.input<typeof schema>;

/** The kebab-case name derived from a message, which is how flatlint names rules. */
const kebab = (a: string): string => {
    return a
        .replace(/[^\da-z]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
};

/**
 * The `__x` placeholders a key carries, in order.
 *
 * `__a` and `__b` are the two the pattern grammar binds; `__c` and up are not
 * bound by anything, so a key using them silently matches nothing. Counting them
 * is how the tool can say so.
 */
const placeholdersOf = (pattern: string): string[] => {
    return [...new Set([...pattern.matchAll(/__(\w)/g)].map(([, name]) => name))];
};

const UNBOUND = [
    '__c',
    '__d',
];

/**
 * What a scaffold needs to know about a key, and nothing more.
 *
 * An earlier version parsed the key as an expression to "check" it, which was
 * theatre: wrapping a PutoutScript key in `const __a = …;` proves the *wrapper*
 * parses, never that the key matches anything. The real question — "does this
 * key match my source?" — is what `test_pattern` is for, and the tool says so
 * rather than pretending to answer it.
 */
export const runBuild = (pattern: string, to?: string, name?: string) => {
    const placeholders = placeholdersOf(pattern);
    
    return {
        pattern,
        placeholders,
        hasPlaceholder: placeholders.length > 0,
        ruleName: name || kebab(pattern).slice(0, 40) || 'my-rule',
        to: to || null,
        unbound: placeholders.filter((placeholder) => {
            return UNBOUND.includes(`__${placeholder}`);
        }),
    };
};

/** `['c', 'd']` -> `__c, __d`, named so the warning below carries no inline arrow. */
const joinUnbound = (placeholders: string[]): string => {
    return placeholders
        .map((placeholder) => {
            return `__${placeholder}`;
        })
        .join(', ');
};

const hasExport = (source: string, what: 'report' | 'replace'): boolean => {
    const pattern = `export\\s+(?:const|function)\\s+${what}\\b`;
    
    return RegExp(pattern).test(source);
};

/**
 * The keys of an `export const <name> = () => ({...})` map.
 *
 * Read off the AST rather than with a regex because a key is a *pattern* and a
 * pattern is full of braces, quotes and `__x` — `'(__args) {'` closes a brace
 * range that a brace-counter gets wrong, which is how a first attempt at this
 * reported `add-missing-round-brace` as having **zero** replace keys when it has
 * fourteen. The walk also skips a computed key instead of guessing at it.
 */
const keysOf = (program: types.Program, name: string): string[] => {
    const keys: string[] = [];
    
    for (const node of program.body) {
        if (node.type !== 'ExportNamedDeclaration')
            continue;
        
        const {declaration} = node;
        
        // `declaration` is null on a re-export, so it is BOTH checked — `?:` would
        // be rewritten to this, and `&&` alone is not the same test: it lets a
        // null through to `.declarations`
        if (!declaration || declaration.type !== 'VariableDeclaration')
            continue;
        
        for (const {id, init} of declaration.declarations) {
            if (id.type !== 'Identifier' || id.name !== name)
                continue;
            
            // bound to a local rather than `objectOf(init)?.properties`, which the
            // fixer rewrote into a call twice
            const object = objectOf(init);
            
            for (const property of object ? object.properties : []) {
                if (property.type !== 'ObjectProperty')
                    continue;
                
                const {key} = property;
                
                if (property.computed || key.type !== 'StringLiteral')
                    continue;
                
                keys.push(key.value);
            }
        }
    }
    
    return keys;
};

/** The object literal an arrow or function `() => ({...})` evaluates to. */
const objectOf = (node?: types.Node | null): types.ObjectExpression | null => {
    if (!node)
        return null;
    
    if (node.type !== 'ArrowFunctionExpression' && node.type !== 'FunctionExpression')
        return null;
    
    const {body} = node;
    
    if (body.type === 'ObjectExpression')
        return body;
    
    if (body.type !== 'BlockStatement')
        return null;
    
    const [first] = body.body;
    
    if (!first || first.type !== 'ReturnStatement')
        return null;
    
    const {argument} = first;
    
    return argument && argument.type === 'ObjectExpression' ? argument : null;
};

export interface Check {
    exported: string[];
    firstIsReport: boolean;
    hasMatch: boolean;
    hasReport: boolean;
    hasReplace: boolean;
    ok: boolean;
    placeholders: number;
    problem: string | null;
    
    /** `match` keys that guard nothing, because `replace` has no such key. */
    deadMatchKeys: string[];
    
    /** `replace` keys acting with no guard at all — the majority, so a note. */
    unguarded: number;
}

/** The `__x` keys of one map that the other map does not have. */
const missingFrom = (keys: string[]) => (key: string) => !keys.includes(key);

export const runCheck = (rule: string): Check => {
    const [error, ast] = tryCatch(parse, rule, {});
    
    if (error)
        return {
            deadMatchKeys: [],
            exported: [],
            firstIsReport: false,
            hasMatch: false,
            hasReport: false,
            hasReplace: false,
            ok: false,
            placeholders: 0,
            problem: `does not parse: ${(error as Error).message}`,
            unguarded: 0,
        };
    
    // the export NAMES, in source order — `report` first is the house
    // convention, so the position is as much the finding as the presence
    const exported: string[] = [];
    
    for (const [, name_] of rule.matchAll(/export\s+(?:const|function)\s+([A-Za-z_$][\w$]*)/g))
        exported.push(name_);
    
    const {program} = ast as types.File;
    const matchKeys = keysOf(program, 'match');
    const replaceKeys = keysOf(program, 'replace');
    const hasReplace = hasExport(rule, 'replace');
    
    // a guard is looked up by the replace key it guards, so a `match` key with
    // no twin in `replace` is never called — the rule fires on every occurrence
    // the author believed they had excluded
    const deadMatchKeys = matchKeys.filter(missingFrom(replaceKeys));
    
    return {
        deadMatchKeys,
        exported,
        firstIsReport: exported[0] === 'report',
        hasMatch: exported.includes('match'),
        hasReport: hasExport(rule, 'report'),
        hasReplace,
        ok: hasExport(rule, 'report') && hasReplace && !deadMatchKeys.length,
        placeholders: (rule.match(/__[ab]\b/g) || []).length,
        problem: null,
        unguarded: hasReplace
            ? replaceKeys.filter(missingFrom(matchKeys)).length
            : 0,
    };
};

export function handler({action, pattern, to, rule, name}: Schema) {
    if (action === 'contract' || !pattern && !rule)
        return {
            content: [{
                type: 'text' as const,
                text: CONTRACT,
            }],
        };
    
    if (rule) {
        const result = runCheck(rule);
        
        if (result.problem)
            return {
                content: [{
                    type: 'text' as const,
                    text: `✗ ${result.problem}`,
                }],
            };
        
        const lines = [
            `exports: ${result.exported.join(', ') || '(none)'}`,
            `__ placeholders: ${result.placeholders}`,
        ];
        
        if (!result.hasReport)
            lines.push('✗ no `report` export — every rule in this repo has one, and `t.report` needs it');
        
        if (!result.hasReplace)
            lines.push('✗ no `replace` export — the replace map decides what matches, so there is nothing to act on');
        
        for (const key of result.deadMatchKeys)
            lines.push(`✗ \`match\` guards ${JSON.stringify(key)}, which is not a key in \`replace\`. The runner looks a guard up BY the replace key it guards, so this one is never called — the rule fires on every occurrence you meant to exclude`);
        
        if (result.exported.length > 1 && !result.firstIsReport)
            lines.push(`? first export is \`${result.exported[0]}\`, not \`report\` — the convention in this repo is report first`);
        
        if (result.hasMatch && result.unguarded)
            lines.push(`? ${result.unguarded} of the replace keys have no \`match\` guard. That is the norm — 51 of the 100 keys across the shipped plugins are unguarded — so it is only a note when you meant to guard one`);
        
        if (result.ok && result.firstIsReport)
            lines.push(result.hasMatch ? '✓ report first, every match key guards a replace key' : '✓ report first, no guard needed');
        
        return {
            content: [{
                type: 'text' as const,
                text: lines.join('\n'),
            }],
        };
    }
    
    const result = runBuild(pattern as string, to, name);
    const {ruleName} = result;
    
    const source = [
        'export const report = () => `the message`;',
        '',
        'export const replace = () => ({',
        `    '${result.pattern}': '${result.to || '/* the fixed source */'}',`,
        '});',
    ].join('\n');
    
    const spec = [
        'import {createTest} from \'#test\';',
        `import * as plugin from '#plugin-${ruleName}';`,
        '',
        'const test = createTest(import.meta.url, {',
        '    plugins: [',
        `        ['${ruleName}', plugin],`,
        '    ],',
        '});',
        '',
        `test('flatlint: ${ruleName}: report', (t) => {`,
        `    t.report('${ruleName}', \`the message\`);`,
        '    t.end();',
        '});',
        '',
        `test('flatlint: ${ruleName}: transform', (t) => {`,
        `    t.transform('${ruleName}');`,
        '    t.end();',
        '});',
        '',
        `test('flatlint: ${ruleName}: no report: <the shape it must ignore>', (t) => {`,
        `    t.noReport('<the shape it must ignore>');`,
        '    t.end();',
        '});',
    ].join('\n');
    
    const notes = [
        `lib/plugins/${ruleName}/`,
        `├── fixture/${ruleName}.js`,
        `├── fixture/${ruleName}-fix.js`,
        '├── index.js',
        '└── index.spec.js',
    ].join('\n');
    
    const warnings = [];
    
    if (!result.hasPlaceholder)
        warnings.push('? the key has no `__x` placeholder, so it can only match that literal and nothing else');
    
    if (result.unbound.length > 0)
        warnings.push(`✗ ${joinUnbound(result.unbound)} is not bound by the pattern grammar — only __a and __b are, so this key matches nothing`);
    
    if (!result.to)
        warnings.push('? no `to` given — the replacement is a placeholder you still have to write');
    
    warnings.push('next: test_pattern the key against a real fixture BEFORE writing the rule. a key nothing matches is a rule that is green, silent, and useless — and that is the one failure a scaffold cannot see for itself');
    
    return {
        content: [{
            type: 'text' as const,
            text: [
                '// index.js',
                source,
                '',
                '// index.spec.js',
                spec,
                '',
                notes,
                '',
                ...warnings,
            ].join('\n'),
        }],
    };
}
