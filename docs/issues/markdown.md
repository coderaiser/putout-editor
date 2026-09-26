# markdown findings

Status: ✅ resolved, ❌ open.

---

## ✅ A `js` fence holding TypeScript — solution: `convert-js-to-ts` in `@putout/plugin-markdown`

A fence labelled `js` whose body is TypeScript is caught by nothing today, and `putout` then
reports its own `quick-lint-js` error *inside the markdown file* — so a docs-only problem
surfaces as a code lint failure.

Fences are plain call expressions in the markdown AST, `codeblock(<lang>, <source>)`.

**Pattern: replacer** — `report` + `match` + `replace`. A bare `replace` map is unconditional
and would relabel every `js` fence, so `match` is what makes the decision per match. That is
still a replacer, not an includer, so it is the *first* choice in the order
(replacer, then includer, then traverser).

**Rule source** for `@putout/plugin-markdown` (not this repo — the plugin is its own package):

```js
// convert-js-to-ts

import {operator, parse} from 'putout';
import {tryCatch} from 'try-catch';

const {
    compare,
    __markdown,
    setLiteralValue,
} = operator;

const isClean = (source, options) => {
    const [error, ast] = tryCatch(parse, source, options);
    
    return !error && !ast.errors.length;
};

const isTypeScript = (source) => isClean(source, {isTS: true}) && !isClean(source);

export const report = () => `Use a 'ts' fence for TypeScript`;

export const match = () => ({
    'codeblock(__args)': ({__args}, {parentPath}) => {
        if (!compare(parentPath.parentPath, __markdown))
            return false;
        
        const [lang, source] = __args;
        
        return lang.value === 'js' && isTypeScript(source.value);
    },
});

export const replace = () => ({
    'codeblock(__args)': ({__args}, path) => {
        const [lang] = __args;
        
        setLiteralValue(lang, 'ts');
        
        return path;
    },
});
```

`tryCatch` rather than a `try`/`catch` block, per the house convention. `match` guards with
`compare(parentPath.parentPath, __markdown)` so the rule only fires inside markdown, the way the
other rules in this plugin do.

## ❌ Example of incorrect code

````markdown
# Gate

```js
const a: string[] = [];
```

```js
interface Foo {
    a: string;
}
```

```js
const plain = [1, 2];
```
````

## ✅ Example of correct code

````markdown
# Gate

```ts
const a: string[] = [];
```

```ts
interface Foo {
    a: string;
}
```

```js
const plain = [1, 2];
```
````

The third fence is already valid JavaScript and stays `js`, as does any non-`js` fence.

**Transform** — verified with the `transform` MCP tool, not just `validate`:

```diff
     heading(1, 'Gate'),
-    codeblock('js', 'const a: string[] = [];'),
-    codeblock('js', 'interface Foo {\n    a: string;\n}'),
-    codeblock('js', 'type X = string;'),
+    codeblock('ts', 'const a: string[] = [];'),
+    codeblock('ts', 'interface Foo {\n    a: string;\n}'),
+    codeblock('ts', 'type X = string;'),
     codeblock('js', 'const plain = [1, 2];'),
     codeblock('js', 'const o = {a: 1};'),
     codeblock('js', 'const broken = '),
     codeblock('ts', 'const already: string = "x";'),
     codeblock('bash', 'echo hi'),
 ]);
```

`find_places` reports 3 — the three TypeScript fences. The `const broken =` and
`const o = {a: 1};` fences are confirmed untouched.

**Two details that matter when landing it.** Babel is in `errorRecovery` mode, so
`interface Foo {}` and `type X = string;` *do* parse as JavaScript — checking that `parse`
throws is not enough, the `errors` array has to be empty. And requiring a clean TypeScript
parse is what keeps a merely broken block from being relabelled: `const broken =` fails both,
so the rule leaves it alone.
