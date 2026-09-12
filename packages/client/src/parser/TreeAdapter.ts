import {
    parseSourceRange,
    type SourceRange,
} from './contract.ts';

const isUndefined = (a: unknown): a is undefined => typeof a === 'undefined';
const isNumber = (a: unknown): a is number => typeof a === 'number';
const isFn = (a: unknown): a is Function => typeof a === 'function';

// One validator, one brand: range validation is owned by the contract module.
const validateRange = parseSourceRange;

export interface FilterTest {
    (value: unknown, key: string): boolean;
}

export interface TreeAdapterFilter {
    key?: string;
    label?: string;
    test?: FilterTest;
}

export interface TreeAdapterOptions {
    filters?: TreeAdapterFilter[];
    openByDefault?: (node: unknown, key: string) => boolean;
    nodeToName?: (node: any) => string | null;
    nodeToRange?: (node: any) => unknown;
    walkNode?: (node: any) => Iterable<TreeAdapterChild>;
    [option: string]: unknown;
}

export interface TreeAdapterChild {
    value: unknown;
    key: string;
    computed?: boolean;
}

export interface TreeAdapterConfig {
    filters?: TreeAdapterFilter[];
    openByDefault?: (node: any, key: string) => boolean;
    openByDefaultNodes?: Set<string>;
    openByDefaultKeys?: Set<string>;
    nodeToName: (node: any) => string | null;
    nodeToRange: (node: any) => unknown;
    walkNode: (node: any) => Iterable<TreeAdapterChild>;
    [option: string]: unknown;
}

export interface TreeAdapterParseResult {
    treeAdapter?: {
        type: string;
        options: TreeAdapterOptions;
    } | null;
}

/**
 * Configurable base class for all tree traversal.
 */
export class TreeAdapter {
    private _ranges = new WeakMap<object, SourceRange | null>();
    private _filterValues: Record<string, boolean> | undefined;
    private _adapterOptions: TreeAdapterOptions;
    constructor(adapterOptions: TreeAdapterOptions, filterValues?: Record<string, boolean>) {
        this._filterValues = filterValues;
        this._adapterOptions = adapterOptions;
    }
    /**
   * Used by UI components to render an appropriate input for each filter.
   */
    getConfigurableFilters() {
        return (this._adapterOptions.filters || []).filter((filter) => Boolean(filter.key));
    }
    /**
   * A more or less human readable name of the node.
   */
    getNodeName(node: unknown) {
        return this._adapterOptions.nodeToName?.(node);
    }
    /**
   * The start and end indices of the node in the source text. The return value
   * is an array of form `[start, end]`. This is used for highlighting source
   * text and focusing nodes in the tree.
   */
    getRange(node: unknown): SourceRange | null | undefined {
        if (!(node && typeof node === 'object'))
            return null;
        
        if (this._ranges.has(node))
            return this._ranges.get(node);
        
        const {nodeToRange} = this._adapterOptions;
        let range: SourceRange | null | undefined = validateRange(nodeToRange?.(node));
        
        if (!range) {
            // If the node doesn't have location data itself, try to derive it from
            // its first and last child.
            let first;
            
            let last;
            const iterator = this.walkNode(node);
            let next = iterator.next();
            
            if (!next.done) {
                first = next.value?.value;
                last = first;
            }
            
            while (!(next = iterator.next()).done) {
                last = next.value?.value;
            }
            
            const rangeFirst = validateRange(!isUndefined(first) && nodeToRange ? nodeToRange(first as any) : null);
            const rangeLast = validateRange(!isUndefined(last) && nodeToRange ? nodeToRange(last as any) : null);
            
            if (rangeFirst && rangeLast)
                range = [
                    rangeFirst[0],
                    rangeLast[1],
                ];
        }
        
        this._ranges.set(node as object, range);
        
        return range;
    }
    
    isInRange(node: unknown, position: number) {
        const range = this.getRange(node);
        
        if (!range)
            return false;
        
        return range[0] <= position && position <= range[1];
    }
    /**
   * Whether or not the provided node should be automatically expanded.
   */
    opensByDefault(node: unknown, key: string) {
        return this._adapterOptions.openByDefault?.(node, key);
    }
    
    isArray(node: unknown): node is unknown[] {
        return Array.isArray(node);
    }
    
    isObject(node: unknown): node is Record<string, unknown> {
        return Boolean(node && typeof node === 'object' && !this.isArray(node));
    }
    /**
   * A generator to iterate over each "property" of the node.
   * Overwriting _walkNode allows a parser to expose information from a node if
   * the node is not implemented as plain JavaScript object.
   */
    *walkNode(node: unknown): Generator<TreeAdapterChild> {
        for (const result of this._walkNode(node)) {
            if ((this._adapterOptions.filters || []).some((filter) => {
                if (filter.key && !this._filterValues?.[filter.key])
                    return false;
                
                return filter.test!(result.value, result.key);
            }))
                continue;
            
            yield result;
        }
    }
    
    *_walkNode(node: unknown): Generator<TreeAdapterChild> {
        yield* this._adapterOptions.walkNode!(node);
    }
}

const TreeAdapterConfigs: Record<string, TreeAdapterConfig> = {
    default: {
        openByDefault: () => false,
        nodeToRange: () => null,
        nodeToName: () => {
            throw Error('nodeToName must be passed');
        },
        walkNode: () => {
            throw Error('walkNode must be passed');
        },
    },
    
    estree: {
        filters: [
            functionFilter(),
            emptyKeysFilter(),
            locationInformationFilter(new Set([
                'range',
                'loc',
                'start',
                'end',
            ])),
            typeKeysFilter(),
        ],
        openByDefaultNodes: new Set(['Program']),
        openByDefaultKeys: new Set([
            'body',
            'elements',
            // array literals
            'declarations',
            // variable declaration
            'expression' // expression statements
            ,
        ]),
        openByDefault(this: TreeAdapterConfig, node: unknown, key: string) {
            const target = node as {
                type?: string;
            } | null | undefined;
            
            return Boolean(target && this.openByDefaultNodes?.has(target.type as string) || this.openByDefaultKeys?.has(key));
        },
        nodeToRange(node: any) {
            if (node.range)
                return node.range;
            
            if (isNumber(node.start) && isNumber(node.end))
                return [node.start, node.end];
            
            return null;
        },
        nodeToName(node: any) {
            return node.type;
        },
        *walkNode(node: any) {
            for (const prop in node) {
                yield {
                    value: node[prop],
                    key: prop,
                    computed: false,
                };
            }
        },
    },
};

export function ignoreKeysFilter(keys: Set<string> = new Set(), key?: string, label?: string): TreeAdapterFilter {
    return {
        key,
        label,
        test(_, key) {
            return keys.has(key);
        },
    };
}

export function locationInformationFilter(keys: Set<string>): TreeAdapterFilter {
    return ignoreKeysFilter(keys, 'hideLocationData', 'Hide location data');
}

export function functionFilter(): TreeAdapterFilter {
    return {
        key: 'hideFunctions',
        label: 'Hide methods',
        test(value) {
            return isFn(value);
        },
    };
}

export function emptyKeysFilter(): TreeAdapterFilter {
    return {
        key: 'hideEmptyKeys',
        label: 'Hide empty keys',
        test(value) {
            return value == null;
        },
    };
}

export function typeKeysFilter(keys?: Set<string>): TreeAdapterFilter {
    return ignoreKeysFilter(keys, 'hideTypeKeys', 'Hide type keys');
}

function createTreeAdapter(type: string, adapterOptions: TreeAdapterOptions, filterValues?: Record<string, boolean>) {
    if (TreeAdapterConfigs[type] == null)
        throw Error(`Unknown tree adapter type "${type}"`);
    
    return new TreeAdapter({
        ...TreeAdapterConfigs[type],
        ...adapterOptions,
    }, filterValues);
}

export function treeAdapterFromParseResult({treeAdapter}: TreeAdapterParseResult, filterValues?: Record<string, boolean>) {
    if (!treeAdapter)
        return new TreeAdapter({
            openByDefault: () => false,
            nodeToRange: () => null,
            nodeToName: () => null,
            *walkNode() {},
        }, filterValues);
    
    return createTreeAdapter(treeAdapter.type, treeAdapter.options, filterValues);
}
