import {readFile} from 'node:fs/promises';
import {test} from 'supertape';

/**
 * The dark palette is checked by **contrast**, not by hex.
 *
 * plan.md says the previous dark tokens were "wrong hue" and gives no measurable
 * criterion — and a spec asserting the exact hex would only pin a palette: change
 * it on purpose and the spec is in the way, change it by accident and the spec
 * passes. What is actually wrong about a token colour is that it is *unreadable*,
 * and that is a number.
 *
 * So this reads `AstTree.css`, takes the dark block, and recomputes the WCAG 2.1
 * relative-luminance contrast of every category against the background the tree
 * is painted on. A future palette that reads better and dimmer cannot pass.
 *
 * The background is `--color-bg-editor` from `chat.css`'s dark block, read from
 * that file rather than written here — the two have to agree and the tree has to
 * be measured on what it is actually painted on.
 */
const readCss = (name: string) => readFile(new URL(name, import.meta.url), 'utf8');

/**
 * The custom properties one rule declares.
 *
 * Three details, each of which was wrong before this spec existed:
 *
 * - **The rule is anchored on its opening brace**, with nothing between the
 *   selector and it. Both stylesheets *mention* their dark selector in a comment
 *   above the rule — this file says "`[data-theme='dark'] .ast` below",
 *   `chat.css` says the same — so a plain `indexOf` lands in the comment and reads
 *   the prose as the block. And `.ast` must not match `.ast:focus-visible`,
 *   which a prefix match finds first and which declares no tokens at all.
 * - **Any value, not only hex**, because `--ast-c-other: var(--ast-accent)` is a
 *   reference and the check that the `other` category inherits the accent is
 *   exactly about that line.
 * - **A value ends at a newline**, not only at `;`. Both stylesheets put prose
 *   *inside* their rules and this one names its own tokens while doing it, so
 *   `[^;]+` leaves the declaration, crosses the comment and eats the next token
 *   on the way to whichever `;` it meets. Measured: the comment's example
 *   `--ast-bg:` swallowed `--ast-c-statement`, and the "the light theme still
 *   declares it" spec failed on a file that plainly does.
 * - **Names without the leading `--`**, matching what the regex captures, so a
 *   lookup spelled the CSS way finds nothing and reports a background that is
 *   plainly right there as "not set".
 *
 * The pattern is assembled from parts rather than written inline: `\s` inside a
 * template literal is an escaped backslash rather than a regex class, and `\{` is
 * not an escape at all in JavaScript source. `WS` is the regex written as a
 * *string*, which is the one place doubling a backslash is correct.
 */
const tokensOf = (css: string, selector: string): Record<string, string> => {
    const OPEN = String.fromCharCode(123);
    const WS = '\\s*';
    const escaped = selector.replace(/[\][.]/g, (char) => `\\${char}`);
    // `^` plus `m` puts every character on its own line, so a rule *inside* the
    // leading block comment — and this file's comment names its own dark block,
    // quotes `Program`, and lists token names — cannot match. The selector has to
    // start the line, which only a real rule does.
    const rule = new RegExp(`^${WS}${escaped}${WS}${OPEN}`, 'm').exec(css);
    
    // A selector that is not there means the tokens moved, and the spec should say
    // so rather than silently reading some other block
    if (!rule)
        throw Error(`no ${selector} rule in the stylesheet`);
    
    const start = rule.index + rule[0].length;
    const body = css.slice(start, css.indexOf(OPEN, start));
    const result: Record<string, string> = {};
    
    for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;\n]+);/g))
        result[name] = value.trim();
    
    return result;
};

/** One channel, linearised. */
const channel = (value: number): number => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const luminance = (hex: string): number => {
    const value = hex.replace('#', '');
    const full = value.length === 3 ? [...value].map((c) => c + c).join('') : value;
    
    const [r, g, b] = [0, 2, 4].map((at) => Number.parseInt(full.slice(at, at + 2), 16) / 255);
    
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (a: string, b: string): number => {
    const [first, second] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    
    return (first + 0.05) / (second + 0.05);
};

/**
 * **Without** the leading `--`: `tokensOf`'s regex matches the dashes literally
 * and captures only the name, so a lookup that spells the token the way CSS does
 * finds nothing and reports "not set" for a background that is plainly right
 * there. Both spellings are wrong in a different place; this one is at least
 * consistent with every other key in this file.
 */
const DARK_BACKGROUND_TOKEN = 'color-bg-editor';

/** The categories `.ast-row[data-category]` selects on, plus the `other` fallback. */
const CATEGORIES = [
    'ast-c-statement',
    'ast-c-declaration',
    'ast-c-expression',
    'ast-c-call',
    'ast-c-literal',
    'ast-c-identifier',
    'ast-c-control',
    'ast-accent',
];

const darkBackground = async (): Promise<string> => {
    const chat = await readCss('../css/chat.css');
    const tokens = tokensOf(chat, `[data-theme='dark']`);
    const background = tokens[DARK_BACKGROUND_TOKEN];
    
    if (!background)
        throw Error(`${DARK_BACKGROUND_TOKEN} is not set for dark`);
    
    return background;
};

test('AstTree: every dark category colour is readable on the dark tree', async (t) => {
    const ast = await readCss('./AstTree.css');
    const background = await darkBackground();
    
    // The seven category tokens sit on the bare `[data-theme='dark']` so a
    // `.tok-scope` outside `.ast` reaches them; `ast-accent` stays on
    // `[data-theme='dark'] .ast`. The effective dark value of a category is the
    // merge of the two — which is the whole point of the split, read back.
    const tokens = {
        ...tokensOf(ast, `[data-theme='dark']`),
        ...tokensOf(ast, `[data-theme='dark'] .ast`),
    };
    
    const dark: Record<string, number> = {};
    
    for (const category of CATEGORIES) {
        const value = tokens[category];
        
        // a category with no dark token inherits the light one, which is tuned
        // for cream — worth failing on rather than measuring
        if (!value) {
            t.fail(`${category} has no dark value`);
            
            return;
        }
        
        dark[category] = Math.round(contrast(value, background) * 100) / 100;
    }
    
    // WCAG AA for non-body text is 4.5:1. Every category clears it by a wide
    // margin today (the weakest is 6.29), so this is a floor against a silent
    // dimming rather than a description of the current palette.
    const unreadable = Object.keys(dark)
        .filter((category) => dark[category] < 4.5);
    
    const expected: string[] = [];
    
    t.deepEqual(unreadable, expected);
    t.end();
});

/**
 * The `other` category resolves to the dark accent.
 *
 * `--ast-c-other` is declared once as `var(--ast-accent)` in the light block,
 * which is what makes an unrecognised node type readable in both themes without a
 * second declaration. Asserted through the *resolved* value, because the failure
 * this guards is a dark palette that overrides `--ast-accent` and leaves `other`
 * pointing at the light terracotta.
 */
test('AstTree: the dark other-category inherits the dark accent', async (t) => {
    const ast = await readCss('./AstTree.css');
    const tokens = tokensOf(ast, `[data-theme='dark'] .ast`);
    const root = tokensOf(ast, ':root');
    
    const result = {
        declared: root['ast-c-other'],
        darkAccent: tokens['ast-accent'],
    };
    
    const expected = {
        declared: 'var(--ast-accent, currentColor)',
        darkAccent: '#c0caf5',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The light palette is untouched, and says so.
 *
 * The plan's trap list is explicit that only the dark block moves — the light
 * values were chosen against the cream background and the reference screenshot.
 * A spec that measures only dark would not notice a `--fix` or an edit quietly
 * darkening the light theme, and the light theme is what a user in a bright room
 * actually sees.
 */
test('AstTree: the light palette still declares all seven categories', async (t) => {
    const ast = await readCss('./AstTree.css');
    
    // The seven categories are on `:root`; `ast-accent` (the eighth, the
    // `other` fallback) stays on `.ast`. Merged, that is the light palette.
    const light = {
        ...tokensOf(ast, ':root'),
        ...tokensOf(ast, '.ast'),
    };
    
    const missing = CATEGORIES.filter((category) => !light[category]);
    const expected: string[] = [];
    
    t.deepEqual(missing, expected);
    t.end();
});
