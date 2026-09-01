export type TransformRequest = {
    fixture: string;
    plugin: string;
};

export type Place = {
    rule: string;
    message: string;
    position: {
        line: number;
        column: number;
    };
};

export type StructuredError = {
    kind: 'plugin_syntax' | 'fixture_syntax' | 'plugin_error';
    message: string;
    position?: {
        line: number;
        column: number;
    };
};

export type TransformDocumentation = {
    description: string;
    method: string;
    url: string;
    body: TransformRequest;
    response: string;
    errors: Record<string, string | {
        kind: string;
        message: string;
        position?: {
            line: number;
            column: number;
        };
    }>;
    links: Record<string, string>;
    examples: {
        name: string;
        plugin: string;
    }[];
};
