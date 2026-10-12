import {parser as jsParser} from '@lezer/javascript';
import {
    highlightCode,
    classHighlighter,
} from '@lezer/highlight';

/**
 * The parser, with the TypeScript dialect on.
 *
 * `jsParser` is the JavaScript grammar alone, so a type annotation or an
 * `interface` parses as a plain identifier and is coloured like one — which is
 * most of what a 🐊**Putout** rule is written in. `configure` returns a **new**
 * parser rather than mutating the imported binding, so the configured one is
 * what every `parse` below goes through.
 *
 * `satisfies`, `as`, generics and `in`/`out`/`const` type-parameter modifiers
 * all come with the dialect, not with the JS grammar.
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
 * Turn a source string into an HTML string with `<span class="tok-*">` wrappers
 * around each token.
 *
 * The grammar is JavaScript **with the TypeScript dialect** (`parser` above), so
 * a type annotation, an `interface` or a generic parameter is a type name rather
 * than a variable name, and is coloured as one.
 *
 * `classHighlighter` from `@lezer/highlight` maps each tag to a `tok-*`
 * class name — `tok-keyword`, `tok-string`, `tok-comment`, `tok-number`,
 * `tok-variableName`, `tok-typeName`, etc. The CSS in `highlight.css` maps
 * those classes to the editor's colour tokens, so the colours follow the
 * active theme automatically.
 *
 * `highlightCode` is a pure callback walker: it never touches the DOM, so
 * this function is fully testable in Node without jsdom.
 *
 * Newlines are preserved as literal `\n` inside the returned string so the
 * caller's line-splitting logic (splitting on `\n`) still works correctly.
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
