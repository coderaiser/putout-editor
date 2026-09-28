# putout patterns

**The essence.** A 🐊Putout rule can be a *template* — a `match`/`replace` map of pattern
strings — with no `parse`, no `print`, and no hand-built AST. `print` and `parse` are the
expensive parts, so a rule that can be a template should be. The model to copy is
`apply-destructuring` in `@putout/plugin-logical-expressions` (sibling checkout at `~/putout`),
which is a whole rule in eleven lines.

## The grammar is not guessable, and getting it wrong fails silently

| Form | Means |
|---|---|
| `__a` | a **property or name** — linked, and substituted |
| `__a__()` | a call to a linked **callee** — substituted |
| `__a__` | an expression placeholder — **not** substituted into a replacement |

That third row is the trap: a replacement written `__b__()` where the key says `__b()` emits the
literal text `__b__()` and reports success. The engine does not complain.

Two things I had wrong, both of which cost more time than the rule itself:

- **`__b()` and `__b__()` are not interchangeable.** Only the first links. A key that looks
  right and silently never fires is worse than a typo, because it reports 0 places and exits 0.
- **The engine caches compiled templates within a process.** Batching several patterns into one
  probe script silently poisons every case after the first, so a pattern that works alone
  returns 0 alongside others. Re-run anything surprising **in a fresh process** before believing
  it.

## Which pattern does what

```js
import {operator} from 'putout';

const {getBinding} = operator;

const DECLARATION = 'const __a = __b().__c && __b__().__c.__d';

export const report = () => 'Bind the left side of && to a local: it is evaluated twice';

export const match = () => ({
    // the one thing a bare pattern cannot say: the name we are about to introduce
    // must not already be bound, or the rewrite shadows it
    [DECLARATION]: ({__c}, path) => !getBinding(path, __c.name),
});

export const replace = () => ({
    [DECLARATION]: `{
        const {__c} = __b();
        const __a = __c && __c.__d;
    }`,
});
```

**`match` and `replace` are alternative plugin shapes, not composable parts.** A rule is a
replacer *or* a traverser; a plugin carrying both is not a thing. The guard belongs in `match`
precisely because that is where the replacer form puts a predicate.

Not every shape has a pattern. A `return`, a `this` receiver and a bare `f() && f().deep` have
no template, and the CSS vocabulary has no `atrule` at all — so those stay AST rules. That is the
shape of the engine, not a failure of effort: measure the shape before rewriting.
