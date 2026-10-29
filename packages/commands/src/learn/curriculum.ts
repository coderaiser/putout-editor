import type {LearnNode} from '../state.types.ts';

/**
 * The `/learn` curriculum: putout concepts as a tree. Pure data: no import,
 * because the chat bundles it for the browser. `curriculum.spec.ts` checks
 * the structure. `related` is filled: the mcp `learn_node` returns it.
 */
export const curriculum: LearnNode[] = [{
    id: 'putout',
    label: 'putout',
    summary: 'the tool, and the three words its rules are written in',
    body: 'Putout is a JavaScript linter and transformer driven by plugins you write yourself. Where eslint asks you to configure a fixed set of rules, putout hands you the AST and lets you decide what is wrong with it — so a convention that exists only in this repository is a rule you can add rather than a review comment you have to repeat.\n\nEvery rule is a plain ES module exporting `report` and one of `fix`, `find`, `traverse`, `replace`, `include` or `scan`. A rule reads like the code it matches, and the same module runs from the CLI, from the editor and from an agent through the mcp.',
    children: [{
        id: 'ast',
        label: 'ast',
        summary: 'the tree every rule walks',
        body: 'Putout parses source with @babel/parser and hands your rule the resulting tree. There is no putout-specific AST to learn: a declaration is a `VariableDeclaration`, a call is a `CallExpression`, and every node carries the `loc` a report is positioned with.\n\nA rule never sees a string. It sees nodes, and the job of a rule is to say which ones are wrong and what they should have been.',
        children: [{
            id: 'ast/nodes',
            label: 'nodes',
            summary: 'the seven node types a beginner meets first',
            body: 'Not every type matters equally. These seven carry most of what a first rule needs to read, and reading them in a tree is how the rest become guessable — a `Program` holds statements, a statement holds expressions, an expression holds the literals and identifiers the source is actually made of.',
            children: [{
                id: 'ast/nodes/VariableDeclaration',
                label: 'VariableDeclaration',
                summary: 'const a = 1 — the kind and the declarators',
                body: 'A `VariableDeclaration` is the `const`, `let` or `var` keyword plus everything it declares. Its `kind` says which, and its `declarations` is an array because `const a = 1, b = 2;` is one declaration with two declarators — a fact that surprises everyone who writes a rule matching the declarator and wonders why it fires twice.\n\nThe declaration itself carries no name and no value. Both live one level down, in the `VariableDeclarator`, which is why a rule about naming reaches past this node.',
                example: 'const a = 1;\n',
                related: ['ast/nodes/VariableDeclarator', 'ast/traversal/paths'],
            }, {
                id: 'ast/nodes/VariableDeclarator',
                label: 'VariableDeclarator',
                summary: 'a = 1 — one name bound to one value',
                body: 'The declarator is the `a = 1` half: an `id` naming what is bound and an `init` holding the value. `init` is `null` for `let x;`, which is the case a rule reading `path.node.init.name` without checking will throw on.\n\nThis is the node most naming and most unused-variable rules actually want, and it is one level below the keyword.',
                example: 'const answer = 42;\n',
                related: ['ast/nodes/VariableDeclaration', 'ast/nodes/Identifier'],
            }, {
                id: 'ast/nodes/ExpressionStatement',
                label: 'ExpressionStatement',
                summary: 'an expression standing where a statement must',
                body: 'Write `a + b;` on its own line and it parses as an `ExpressionStatement` wrapping an expression. The wrapper exists because a statement position needs a statement, and it is invisible until you write a rule matching `BinaryExpression` and find it reports the *statement* rather than the expression.\n\nThe `expression` field is where the thing you actually care about lives.',
                example: 'a + b;\n',
                related: ['ast/nodes/CallExpression'],
            }, {
                id: 'ast/nodes/CallExpression',
                label: 'CallExpression',
                summary: 'f(a, b) — the callee and the arguments',
                body: 'A call is a `callee` — what is being called, itself an expression — plus an `arguments` array. `console.log(a)` is a `CallExpression` whose callee is a `MemberExpression`, which is why "find every console.log" is a rule about the callee and not about the call.\n\n`arguments` is a plain array, so a rest argument is a `RestElement` rather than a flag, and a spread call has one among ordinary arguments.',
                example: 'log("hello");\n',
                related: ['ast/nodes/ExpressionStatement', 'patterns/__args'],
            }, {
                id: 'ast/nodes/Identifier',
                label: 'Identifier',
                summary: 'a — the name itself, and nothing else',
                body: 'An identifier is a bare name: `a`, `log`, `console`. It has a `name` and no children, which makes it the leaf almost every other node is built from — and the reason a rule matching `Identifier` fires far more often than expected.\n\nThe same node is used for a declaration, a reference and a property key. Distinguishing those is the parent\'s job, not the identifier\'s.',
                example: 'const name = "putout";\n',
                related: ['ast/nodes/VariableDeclarator', 'patterns/__identifier'],
            }, {
                id: 'ast/nodes/StringLiteral',
                label: 'StringLiteral',
                summary: '"text" — a value with a name you can read',
                body: 'A string literal carries its text in `value` and its quoting in `extra.raw`. The two differ for every escaped or multi-line string, so printing `value` is what makes a report readable and reading `raw` is what makes a fix that preserves the author\'s quoting.\n\nBabel calls it `StringLiteral`. Older ASTs and most tutorials say `Literal`, and `node.type === "StringLiteral"` against a `Literal` matches nothing — silently, with exit code 0.',
                example: 'const greeting = "hello";\n',
                related: ['ast/nodes/Identifier'],
            }, {
                id: 'ast/nodes/ArrowFunctionExpression',
                label: 'ArrowFunctionExpression',
                summary: '(a) => a — params, body, and no `this`',
                body: 'An arrow function has `params` and a `body`, and its body is an expression unless it is a `BlockStatement`. `(a) => a` and `(a) => { return a; }` are the same rule to most fixers and two different body shapes.\n\nUnlike a `FunctionExpression` it has no `this` of its own, which is the entire reason putout\'s `convert-to-arrow-function` exists and also why that rule cannot be applied blindly.',
                example: 'const double = (a) => a * 2;\n',
                related: ['plugin-types/traverser'],
            }],
        }, {
            id: 'ast/traversal',
            label: 'traversal',
            summary: 'how a rule is handed the tree',
            body: 'A rule does not walk the tree itself. It declares which nodes it cares about and putout calls it once per match, with a `NodePath` — the node plus its parent, its scope and every operator needed to change it.\n\nThat inversion is the whole design: the traversal is shared, tested and identical across all 622 shipped rules, and a rule only says what it found.',
            children: [{
                id: 'ast/traversal/visitors',
                label: 'visitors',
                summary: 'a map from node type to handler',
                body: 'A `traverse` returns an object keyed by node type, and each value is called for every node of that type. `{"CallExpression"(path) {...}}` runs on every call in the file.\n\nThe key can also be a **pattern** string — `"__a.push(__args)"` — which is the same visitor mechanism with the matching done for you. A syntactic shape belongs in the key; anything needing the parent or a condition belongs in the body, behind early `return`s and a single `push`.',
                example: 'export const traverse = ({push}) => ({\n    Identifier(path) {\n        push(path);\n    },\n});\n',
                related: ['plugin-types/traverser', 'patterns/__a'],
            }, {
                id: 'ast/traversal/paths',
                label: 'paths',
                summary: 'the node, plus everything around it',
                body: 'A `NodePath` is a cursor, not a value. `path.node` is the node; `path.parentPath`, `path.scope`, `path.remove()`, `path.replaceWith()` and `path.get()` are the reason a rule never has to know where in the tree it is.\n\nMutating through the path rather than assigning to `path.node` is what keeps the tree consistent — and `path.remove()` on a node nothing else uses is how `--fix` legitimately empties a file to zero bytes.',
                example: 'export const traverse = ({push}) => ({\n    "const __a = __b;"(path) {\n        push(path);\n    },\n});\n',
                related: ['ast/traversal/visitors', 'plugin-types/traverser'],
            }],
        }],
    }, {
        id: 'plugins',
        label: 'plugins',
        summary: 'report, and then one of five ways to answer',
        body: 'A plugin is a module with a `report` and at least one of `fix`, `find`, `traverse`, `replace`, `include` or `scan`. `report` is what a user reads; the rest is what the runner does about it.\n\nThe three exports below are the parts every kind of rule has in common, and they are the ones worth getting right first: a `report` that does not locate its problem is a rule nobody can act on, however correct the fix is.',
        children: [{
            id: 'plugins/find',
            label: 'find',
            summary: 'push what is wrong, once every guard has passed',
            body: '`find` declares which nodes to look at, and `push(path)` marks one as wrong. Everything before the `push` is a guard, and every guard is an early `return` — so the push is the one statement that says "this really is a problem".\n\nA `find` with no `fix` compiles, passes a `find_places` run and then throws `Looks like \'fix\' is not a \'function\' but \'undefined\'` the first time a user transforms with it. The runner requires a `fix`; only the finder mode does not.',
            example: 'export const report = () => "debugger should not be used";\n\nexport const find = (ast, {traverse}) => ({\n    DebuggerStatement(path) {\n        traverse(path);\n    },\n});\n\nexport const fix = (path) => path.remove();\n',
            related: ['plugins/fix', 'plugins/report'],
        }, {
            id: 'plugins/fix',
            label: 'fix',
            summary: 'receives exactly what find pushed',
            body: '`fix` is called once per pushed path and receives whatever was pushed — a `NodePath`, a string, an object. Whatever `find` hands over is what `fix` gets, so a `push({path, name})` arrives as that object and a bare `push(path)` arrives as the path.\n\nA fix runs under `--fix` only. Nothing in a normal run mutates the source, which is why `putout` without `--fix` is safe to run over a tree you have not committed.',
            example: 'export const fix = (path) => path.remove();\n',
            related: ['plugins/find'],
        }, {
            id: 'plugins/report',
            label: 'report',
            summary: 'the sentence a user reads',
            body: '`report` returns the message, and it is the first export of every rule by convention — measured across the 622 rule files in the putout repository, 603 of the plain `export const report` open with it.\n\nIt can take the pushed value as its first argument, so a report can name what it found: `(_, {message}) => message` is the shape a `matchFiles` rule borrows from its operator. A message that does not say *which* thing is wrong is a message that sends the reader back to the source.',
            example: 'export const report = () => "Use \'if\' instead of ternary";\n',
            related: ['plugins/find', 'plugin-types/scanner'],
        }],
    }, {
        id: 'patterns',
        label: 'patterns',
        summary: 'JavaScript with placeholders, matched for you',
        body: 'A pattern key is ordinary JavaScript with `__` placeholders in it, and putout compiles it into the same AST comparison a hand-written `traverse` would do. `"const __a = __b;"` finds every declaration without you naming a single node type.\n\nThe trap is that **every mistake here is silent**. A key that matches nothing and a replacement that changes nothing both exit 0, so a pattern is checked with `test_pattern` before it becomes a rule — that tool answers whether it matched, how many places, and what each placeholder bound to.',
        children: [{
            id: 'patterns/__a',
            label: '__a = __b',
            summary: 'simple replacement, with the value carried across',
            body: 'Two placeholders and a replacement is the whole of a `replacer`. `"__a ? __b : __c"` becomes `"if (__a) __b; else __c;"` and each placeholder fills in from what it matched.\n\nA replacement may only reuse a name the **key** declared. `"f(__a)"` → `"g(__a)"` works; `"f(__)"` → `"g(__a)"` throws `Looks like template values not linked`, because nothing bound `__a`. And two underscores bind nothing at all: `"f(__a__)"` → `"g(__a__)"` reports success having changed nothing.',
            example: 'const ready = flag ? "yes" : "no";\n',
            related: ['patterns/__args', 'plugin-types/replacer'],
        }, {
            id: 'patterns/__args',
            label: '__args',
            summary: 'zero or more arguments',
            body: '`__args` matches any number of arguments, including none, which is what makes `"__a.push(__args)"` one key that covers `push()`, `push(a)` and `push(a, b)`.\n\n`__args__a` is the *linked* form: the same call shape has to repeat, so `"((__args__a) => __c(__args__a))(__args__b)"` finds `fn(value)` and not `((a) => fn(42))(value)`. Reach for it when a rule must prove two call sites agree.',
            example: 'list.push("a", "b");\n',
            related: ['patterns/__a', 'ast/nodes/CallExpression'],
        }, {
            id: 'patterns/__identifier',
            label: '__identifier',
            summary: 'any identifier, bound',
            body: 'A named placeholder that only matches identifiers, so `"const __identifier = __b"` finds a declaration and does not find a member expression or a literal in the same position.\n\nUse the narrow placeholder when the shape allows several node types and only one is interesting. `__a` matching too much is the failure a rule author notices last, because it still compiles and still runs.',
            example: 'const total = price * count;\n',
            related: ['ast/nodes/Identifier', 'patterns/__a'],
        }],
    }, {
        id: 'plugin-types',
        label: 'plugin-types',
        summary: 'five shapes, picked by what the rule must do',
        body: 'Every shipped rule is one of these five. Choosing the shape is the first decision in writing a rule, and the wrong one is not a style problem: a `replacer` cannot reach the parent, a `traverser` cannot express pure substitution, and an `includer` reports once per file rather than once per node.\n\nStart from `traverser` — 290 of 770 rule files use it, and it is the house default. Drop to `replacer` only for pure substitution, and reach for `scanner` when the answer is about the whole file.',
        children: [{
            id: 'plugin-types/replacer',
            label: 'replacer',
            summary: 'report + replace, for pure substitution',
            body: 'A `replacer` is `report` plus `replace`, and `replace` is a map from pattern key to replacement. There is no `path`, no parent and no condition beyond what `match` gates on — which is exactly why it is the shortest rule shape and the one that cannot be extended.\n\nAdd `match` to gate on a condition and it is still a replacer: `match` is the gate, `replace` is the answer. 162 rule files are this shape, and a single-use matcher belongs inline in the `match` body rather than in a named helper.',
            example: 'export const report = () => "Use template literal";\n\nexport const replace = () => ({\n    "__a + \'__b\'": "`__a__b`",\n});\n',
            related: ['patterns/__a'],
        }, {
            id: 'plugin-types/traverser',
            label: 'traverser',
            summary: 'report + traverse + fix — the house default',
            body: 'The most common shape, and the one to start from. `traverse` returns the visitor, `fix` changes what it pushed, and everything a rule needs to know about position or ancestry is reachable from the `NodePath`.\n\nUse a pattern string as the visitor key when the shape is syntactic and a node type when you need the parent. Guard with early `return`s, then `push(path)` once every guard has passed.',
            example: 'export const report = () => "Avoid \'debugger\'";\n\nexport const traverse = ({push}) => ({\n    DebuggerStatement(path) {\n        push(path);\n    },\n});\n\nexport const fix = (path) => path.remove();\n',
            related: ['ast/traversal/visitors', 'plugins/find'],
        }, {
            id: 'plugin-types/includer',
            label: 'includer',
            summary: 'report + include + filter + fix',
            body: 'An `includer` reports **once per file** rather than once per node, and `include` says which files it applies to. `filter` narrows within them and `fix` answers.\n\nReach for it when the finding is a property of the file — a file that should not exist, an import that should not be here — because a per-node rule would report the same fact once for every line that shows it.',
            example: 'export const report = () => "Add \'use strict\'";\n\nexport const include = () => [\n    "Program",\n];\n\nexport const filter = ({node}) => !node.directives;\n\nexport const fix = (path) => {\n    path.node.directives = [];\n};\n',
            related: ['plugin-types/traverser'],
        }, {
            id: 'plugin-types/scanner',
            label: 'scanner',
            summary: 'report + scan + fix — one answer for the whole file',
            body: 'A `scanner` reads the source as a whole and reports a summary. `scan` is handed the raw source, and `push` takes whatever the fix should receive — including an object, in which case the runner hands `fix` that object\'s `path` when it has one.\n\nThe mcp\'s own `formats` tool is a scanner in spirit: it answers a question about a document rather than marking a node in it. Note that a scanner writes its own `report`, because there is no operator to borrow one from.',
            example: 'export const report = (source) => `File has ${source.split("\\n").length} lines`;\n\nexport const scan = (source, push) => {\n    push(source);\n};\n\nexport const fix = () => {};\n',
            related: ['plugins/report', 'plugin-types/includer'],
        }, {
            id: 'plugin-types/declarator',
            label: 'declarator',
            summary: 'declare only — no report, no fix',
            body: 'A `declarator` exports `declare` and nothing else: it tells putout which identifiers a rule may use without importing them. `@putout/plugin-declare` is what makes `remove`, `rename` and every `types` member available inside a rule body with no import line.\n\nIt cannot run in the normal runner — there is no `find`, `traverse`, `replace`, `include` or `scan` — so it is always paired with the rules it declares for. This editor compiles every template through `compileRule`, which is why its templates write `path.remove()` with no import and no `path` parameter.',
            example: 'export const declare = () => ({\n    remove: "const remove = () => {};",\n});\n',
            related: ['plugins/report'],
        }],
    }],
}];

/**
 * Every node in the tree, depth first, parents before children.
 *
 * Exported because three consumers need the same walk and a fourth copy of it
 * would be a fourth thing to keep in step: the mcp's `learn_node` looks an id
 * up in it, `curriculum.spec.ts` asserts the structure over it, and
 * `flattenLearn` derives its rows from it.
 */
export function learnNodes(nodes: LearnNode[] = curriculum): LearnNode[] {
    const result: LearnNode[] = [];
    
    for (const node of nodes) {
        result.push(node);
        
        if (node.children)
            result.push(...learnNodes(node.children));
    }
    
    return result;
}

/**
 * One node by id, or `null`.
 *
 * A linear walk rather than a `Map` built at module scope: the curriculum is
 * twenty-odd nodes, a map would be built whether or not anything asked, and
 * `null` is the answer an agent gets for a typo either way.
 */
export function findLearnNode(id: string, nodes: LearnNode[] = curriculum): LearnNode | null {
    return learnNodes(nodes).find(({id: nodeId}) => nodeId === id) || null;
}
