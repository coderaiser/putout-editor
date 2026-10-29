import {parser as jsParser} from '@lezer/javascript';
import {
    highlightCode,
    classHighlighter,
} from '@lezer/highlight';

/**
 * The parser with the TypeScript dialect: type annotations, `interface`,
 * `satisfies`, `as` and generics are tokens, not identifiers. `configure`
 * returns a new parser.
 */
const parser = jsParser.configure({
    dialect: 'ts',
});

/**
 * Escape the five HTML-significant characters so arbitrary source code
 * cannot inject markup. Applied to every text run before it is wrapped in
 * a span, so a string literal containing `<script>` stays `&lt;script&gt;`.
 */
export const escHtml = (text: string): string => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Source to HTML with a `<span class="tok-*">` around each token.
 * `classHighlighter` gives the classes; `highlight.css` maps them to theme
 * colours. No DOM, so it runs in Node. Newlines stay as `\n`.
 */
export const highlight = (code: string): string => {
    const tree = parser.parse(code);
    const parts: string[] = [];
    
    highlightCode(code, tree, classHighlighter, (text, classes) => {
        const escaped = escHtml(text);
        parts.push(classes ? `<span class="${classes}">${escaped}</span>` : escaped);
    }, () => {
        parts.push('\n');
    });
    
    return parts.join('');
};
