import {z} from 'zod';
import {tryCatch} from 'try-catch';
import {montag} from 'montag';
import {parse} from 'putout';

export const name = 'flatlint_rule';

export const description =
    'Write a flatlint rule — a token-level linter that fixes syntax errors, ' +
    'shaped exactly like a putout plugin: `report` first, then a `replace` map of ' +
    'PutoutScript keys. flatlint has NO `match`: the key is the pattern and its ' +
    'presence is the condition. It also has no AST, so a rule works on a file that ' +
    'does not parse. ' +
    'Call {action: "contract"} for the full shape including the test harness and the ' +
    'fixture layout; pass `pattern` to get the rule, fixture and spec generated; pass ' +
    '`rule` to have one checked — invented keys, a missing `report`, and a pattern ' +
    'that matches nothing are all reported.';

/**
 * What a flatlint plugin is, in one object.
 *
 * `{report, replace}` — the same pair `packages/plugin-putout-editor` exports, and
 * the reason a flatlint spec is a `createTest` spec with `t.report` and
 * `t.transform`. What is **absent** is `match`: a `replace` map is the matcher.
 */
const CONTRACT = montag`
A flatlint plugin, in full:
    
    export const report = () => \`Remove useless '='\`;
    
    export const replace = () => ({
        'import __a = from "__b"': 'import __a from "__b"',
        'function __a = (': 'function __a(',
    });

Two exports and no \`match\`: the KEY is the pattern and its presence is the
condition. \`report\` comes first, as in every rule in this repo.

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
is how you prove the rule stays quiet on a shape it must not touch.`.replace(/[ \t]+$/gm, '');

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

export interface Check {
    exported: string[];
    firstIsReport: boolean;
    hasMatch: boolean;
    hasReport: boolean;
    hasReplace: boolean;
    ok: boolean;
    placeholders: number;
    problem: string | null;
}

export const runCheck = (rule: string): Check => {
    const [error] = tryCatch(parse, rule, {});
    
    if (error)
        return {
            exported: [],
            firstIsReport: false,
            hasMatch: false,
            hasReport: false,
            hasReplace: false,
            ok: false,
            placeholders: 0,
            problem: `does not parse: ${(error as Error).message}`,
        };
    
    // the export NAMES, in source order — `report` first is the house
    // convention, so the position is as much the finding as the presence
    const exported: string[] = [];
    
    for (const [, name_] of rule.matchAll(/export\s+(?:const|function)\s+([A-Za-z_$][\w$]*)/g))
        exported.push(name_);
    
    return {
        exported,
        firstIsReport: exported[0] === 'report',
        hasMatch: exported.includes('match'),
        hasReport: hasExport(rule, 'report'),
        hasReplace: hasExport(rule, 'replace'),
        ok: hasExport(rule, 'report') && hasExport(rule, 'replace') && !exported.includes('match'),
        placeholders: (rule.match(/__[ab]\b/g) || []).length,
        problem: null,
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
            lines.push('✗ no `replace` export — in flatlint the replace MAP is the matcher, there is nothing else to match with');
        
        if (result.hasMatch)
            lines.push('✗ has a `match` export. flatlint matches on the presence of a replace KEY; a `match` is putout\'s shape and is ignored here');
        
        if (result.exported.length > 1 && !result.firstIsReport)
            lines.push(`? first export is \`${result.exported[0]}\`, not \`report\` — the convention in this repo is report first`);
        
        if (result.ok && result.firstIsReport)
            lines.push('✓ report first, replace second, no match');
        
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
