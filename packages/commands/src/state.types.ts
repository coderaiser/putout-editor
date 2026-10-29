import type {Block} from '@putout/flow';

export interface ChatState {
    source: string;
    plugin: string;
}

export interface FlatNode {
    id: string;
    pid: string | null;
    depth: number;
    
    /**
     * The name of the property that holds this node in its parent: `id`, `init`,
     * or `body[0]` for an array element. `''` for the root.
     */
    key: string;
    type: string;
    detail: string;
    line: number;
    col: number;
    endLine: number;
    endCol: number;
}

/**
 * One concept in the `/learn` curriculum. Pure data for the chat tree, the
 * mcp `learn_*` tools and the structural spec. `id` is the path from the root
 * (`ast/nodes/VariableDeclaration`) and is unique. `label` can repeat.
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
 * A `LearnNode` as a row for `LearnTree`. Same `id`/`pid`/`depth` as
 * `FlatNode`, so the tree widget works unchanged. No position fields: a
 * concept has no position. `body` and `example` go to `learnOpen` on enter.
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
     * The argument shape in shell brackets: `source [source]`,
     * `ast [--full] [--query type]`, `clear []`. A command with no argument
     * writes `[]`.
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
