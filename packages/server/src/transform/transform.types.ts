export type TransformRequest = {
    fixture: string;
    plugin: string;
};

export type TransformDocumentation = {
    description: string;
    method: string;
    url: string;
    body: TransformRequest;
    response: string;
    errors: Record<string, string>;
    links: Record<string, string>;
    examples: {
        name: string;
        plugin: string;
    }[];
};
