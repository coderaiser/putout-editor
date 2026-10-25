import type {Block} from '@putout/flow';

export interface ChatState {
    source: string;
    plugin: string;
}

export interface FlatNode {
    id: string;
    pid: string | null;
    depth: number;
    type: string;
    detail: string;
    line: number;
    col: number;
    endLine: number;
    endCol: number;
}

/**
 * One concept in the `/learn` curriculum.
 *
 * Pure data with no behaviour, so the same tree serves three consumers: the
 * chat's tree view, the mcp's three `learn_*` tools, and the structural spec
 * that keeps the curriculum well-formed as it grows. That is why it lives in
 * this package rather than in either of them.
 *
 * `id` is the slash-separated path from the root — `ast/nodes/VariableDeclaration`
 * — and it is the **only** thing that names a node. `label` is what a row shows
 * and may repeat; `id` may not, which `curriculum.spec.ts` asserts.
 */
export interface LearnNode {
    id: string;
    label: string;
    summary: string;
    body: string;
    
    /**
     * Source that produces the node or demonstrates the pattern, for `[try it →]`.
     *
     * Omitted on a **container** node: pressing enter on `ast` or `nodes`
     * expands it, and a container with an example would be a leaf wearing a
     * caret. `curriculum.spec.ts` pins that in both directions — every leaf has
     * one, every container does not.
     */
    example?: string;
    
    /** Ids of related concepts, for the mcp's graph traversal. */
    related?: string[];
    children?: LearnNode[];
}

/**
 * A `LearnNode` flattened into a row, the shape `LearnTree` draws.
 *
 * Mirrors `FlatNode` — same `id`/`pid`/`depth` spine, because the tree widget's
 * collapse, filter and keyboard navigation are written against exactly those
 * three fields and are shared unchanged. What replaces `type`/`detail` is
 * `label`/`summary`, and `line`/`col`/`endLine`/`endCol` go away entirely: a
 * concept has no position in a file, so a row that carried one would be
 * asserting a fact that does not exist.
 *
 * `body` and `example` are carried even though no row draws them, and that is
 * the point: pressing enter on a leaf hands the row straight to `learnOpen`,
 * which needs both. Resolving them from the tree again would mean a lookup
 * whose miss branch nothing can reach — the tree is built *from* these rows.
 */
export interface FlatLearnNode {
    id: string;
    pid: string | null;
    depth: number;
    label: string;
    summary: string;
    body: string;
    example?: string;
    hasExample: boolean;
    hasChildren: boolean;
}

export interface Place {
    message?: string;
    rule?: string;
    position?: {
        line: number;
        column: number;
    };
}

export type CommandResult =
    | {
        type: 'ast';
        nodes: FlatNode[];
        source: string;
    }
    | {
        type: 'places';
        data: Place[];
    }
    | {
        type: 'transform';
        before: string;
        after: string;
    }
    | {
        type: 'source';
        data: string;
    }
    | {
        type: 'text';
        data: string;
    }
    | {
        type: 'error';
        message: string;
    } /**
     * The `/learn` answer: the whole curriculum, top-level nodes only.
     *
     * Not flattened, unlike `ast`. The tree is navigated client-side and the
     * children are already nested, so sending `FlatLearnNode[]` would send the
     * same tree twice — once as rows and once as the `children` the flattening
     * was derived from. `flattenLearn` runs where the rows are drawn.
     */
    
    | {
        type: 'learn';
        tree: LearnNode[];
    } /**
     * The `[try it →]` half of an opened leaf.
     *
     * A separate arm rather than part of `learn`, because the two are answered
     * at different times: `learnOpen` appends the body as one message and this
     * as the next, so `Message` renders them as two blocks rather than as one
     * block that has to know about buttons.
     */
    
    | {
        type: 'tryit';
        source: string;
    } /**
     * The `/flow` answer: control-flow blocks plus a printer-friendly text
     * rendering, so a snapshot test or an MCP tool can read the graph without
     * re-parsing. `source` travels with the blocks so the left panel can
     * highlight the source lines a block occupies.
     */
    
    | {
        type: 'flow';
        text: string;
        blocks: Block[];
        source: string;
    };

export interface Command {
    name: string;
    
    /**
     * What follows the name, in the shell's brackets — `source [source]`,
     * `ast [--full] [--query type]`, `clear []`.
     *
     * Declared on the command rather than derived from `flags`, because the
     * flags are only the `--` options: what a command takes as its *argument*
     * is not in that list, and `help` is the only place a user is told. A
     * command that takes nothing writes `[]` rather than leaving it out, so a
     * row is never ambiguous about whether the brackets were forgotten.
     */
    usage: string;
    description: string;
    flags: string[];
    
    /**
     * Takes what it needs: a command that does not read `state`, like
     * `source` or `clear`, declares `args` alone and is still assignable.
     * `find`, `transform` and `test-pattern` reach 🐊**Putout**, which is
     * async, so a run may return a promise the caller awaits.
     */
    run: (args: string, state: ChatState) => CommandResult | Promise<CommandResult>;
}
