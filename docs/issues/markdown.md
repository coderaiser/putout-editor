# markdown findings

Status: ✅ resolved, ❌ open.

***

## ✅ A ` ```js ` fence holding TypeScript — solution: a `codeblock` rule in `@putout/plugin-markdown`

A fence labelled `js` whose body is TypeScript is not caught by anything today, and
`putout` then reports its own `quick-lint-js` error *inside the markdown file* — so a
docs-only problem shows up as a code lint failure.

Fences are plain call expressions in the markdown AST, `codeblock(<lang>, <source>)`, so a
`replacer` is enough; no `traverse` needed.

**Rule source** for `@putout/plugin-markdown` (not this repo — the plugin is its own package):

```js
const tsOnly = [
    /\binterface\s+\w/,
    /\btype\s+\w+\s*=/,
    /\benum\s+\w/,
    /\bdeclare\s+(module|global|const|let|var|function|class)\b/,
    /\bnamespace\s+\w/,
    /\bimplements\s+\w/,
    /\bsatisfies\s+\w/,
    /\bas\s+const\b/,
    /:\s*(string|number|boolean|unknown|any|void|never)\b/,
];

export const report = () => `Use a 'ts' fence for TypeScript`;

export const include = () => [
    'codeblock(\'js\', __a)',
];

export const filter = (path) => {
    const [, source] = path.node.arguments;
    
    return tsOnly.some((pattern) => pattern.test(source.value));
};

export const replace = () => ({
    'codeblock(\'js\', __a)': 'codeblock(\'ts\', __a)',
});
```

**Transform** — verified with the `transform` MCP tool, not just `validate`:

```diff
 __putout_processor_markdown([
     heading(1, 'Gate'),
-    codeblock('js', 'const a: string[] = [];'),
-    codeblock('js', 'interface Foo {\n    a: string;\n}'),
+    codeblock('ts', 'const a: string[] = [];'),
+    codeblock('ts', 'interface Foo {\n    a: string;\n}'),
     codeblock('js', 'const plain = [1, 2];'),
     codeblock('js', 'const o = {a: 1};'),
     codeblock('ts', 'const already: string = "x";'),
     codeblock('bash', 'echo hi'),
 ]);
```

`find_places` reports exactly 2 — lines 3 and 4.

Marker-based rather than "does not parse as JavaScript", on purpose: the parse-based version
also fires on a block that is merely *broken* JavaScript, which would quietly relabel a typo as
TypeScript. Markers only fire on constructs JavaScript cannot have, so `const o = {a: 1};`
and `const plain = [1, 2];` are left alone, and non-`js` fences never match `include`.
