export type NodeRange = [
    number,
    number,
];

export type TreeAdapterChild = {
    key: string;
    value: unknown;
    computed: boolean;
};

export type TreeAdapter = {
    getRange(value: unknown): NodeRange | null;
    getNodeName(value: unknown): string | null;
    walkNode(value: unknown): Iterable<TreeAdapterChild>;
    opensByDefault(value: unknown, name: string | null): boolean;
};

export type ElementSettings = {
    autofocus: boolean;
    hideFunctions?: boolean;
    hideEmptyKeys?: boolean;
    hideLocationData?: boolean;
    hideTypeKeys?: boolean;
};

export type ElementProps = {
    value: unknown;
    name: string | null;
    focusPath: unknown[];
    level: number;
    open: boolean;
    deepOpen: boolean;
    computed: boolean;
    treeAdapter: TreeAdapter;
    settings: ElementSettings;
    parent: unknown;
};

export type ElementState = {
    open: boolean;
    deepOpen: boolean;
    value: unknown;
    error: Error | null;
};
