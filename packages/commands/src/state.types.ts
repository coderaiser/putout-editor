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
    };

export interface Command {
    name: string;
    description: string;
    flags: string[];
    run: (args: string, state: ChatState) => CommandResult;
}
