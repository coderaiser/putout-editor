import {test} from 'supertape';
import getFocusPath, {nodeToRange} from './getFocusPath.ts';

type ArrayLikeNode = unknown[] & {
    [key: string]: unknown;
    child?: unknown;
    children?: Iterable<unknown>;
    numberProp?: number;
    nullProp?: unknown;
    _range?: [
        number,
        number,
    ];
};

test('getFocusPath: finds path length to nested node by position', (t) => {
    const grandchild = {
        _range: [10, 20],
        length: 0,
    };
    
    const child = {
        _range: [0, 50],
        child: grandchild,
        length: 1,
    };
    
    const root = {
        _range: [0, 100],
        child,
        length: 1,
    };
    
    const parser = {
        nodeToRange(node: {
            _range?: [
                number,
                number,
            ];
        }) {
            return node._range;
        },
        *forEachProperty(node: {
            child?: unknown;
            children?: Iterable<unknown>;
            [key: string]: unknown;
        }) {
            if (node.child)
                yield {
                    value: node.child,
                };
            
            if (node.children)
                for (const c of node.children)
                    yield {
                        value: c,
                    };
        },
    };
    
    const path = getFocusPath(root, 15, parser);
    
    t.equal(path.length, 3);
    t.end();
});

test('getFocusPath: path root is first item', (t) => {
    const grandchild = {
        _range: [10, 20],
        length: 0,
    };
    
    const child = {
        _range: [0, 50],
        child: grandchild,
        length: 1,
    };
    
    const root = {
        _range: [0, 100],
        child,
        length: 1,
    };
    
    const parser = {
        nodeToRange(node: {
            _range?: [
                number,
                number,
            ];
        }) {
            return node._range;
        },
        *forEachProperty(node: {
            child?: unknown;
            children?: Iterable<unknown>;
            [key: string]: unknown;
        }) {
            if (node.child)
                yield {
                    value: node.child,
                };
            
            if (node.children)
                for (const c of node.children)
                    yield {
                        value: c,
                    };
        },
    };
    
    const path = getFocusPath(root, 15, parser);
    
    t.equal(path[0], root);
    t.end();
});

test('getFocusPath: path child is second item', (t) => {
    const grandchild = {
        _range: [10, 20],
        length: 0,
    };
    
    const child = {
        _range: [0, 50],
        child: grandchild,
        length: 1,
    };
    
    const root = {
        _range: [0, 100],
        child,
        length: 1,
    };
    
    const parser = {
        nodeToRange(node: {
            _range?: [
                number,
                number,
            ];
        }) {
            return node._range;
        },
        *forEachProperty(node: {
            child?: unknown;
            children?: Iterable<unknown>;
            [key: string]: unknown;
        }) {
            if (node.child)
                yield {
                    value: node.child,
                };
            
            if (node.children)
                for (const c of node.children)
                    yield {
                        value: c,
                    };
        },
    };
    
    const path = getFocusPath(root, 15, parser);
    
    t.equal(path[1], child);
    t.end();
});

test('getFocusPath: path grandchild is third item', (t) => {
    const grandchild = {
        _range: [10, 20],
        length: 0,
    };
    
    const child = {
        _range: [0, 50],
        child: grandchild,
        length: 1,
    };
    
    const root = {
        _range: [0, 100],
        child,
        length: 1,
    };
    
    const parser = {
        nodeToRange(node: {
            _range?: [
                number,
                number,
            ];
        }) {
            return node._range;
        },
        *forEachProperty(node: {
            child?: unknown;
            children?: Iterable<unknown>;
            [key: string]: unknown;
        }) {
            if (node.child)
                yield {
                    value: node.child,
                };
            
            if (node.children)
                for (const c of node.children)
                    yield {
                        value: c,
                    };
        },
    };
    
    const path = getFocusPath(root, 15, parser);
    
    t.equal(path[2], grandchild);
    t.end();
});

test('getFocusPath: returns empty when pos not in any range', (t) => {
    const node = {
        _range: [0, 5],
        length: 0,
    };
    
    const parser = {
        nodeToRange(n: {
            _range?: [
                number,
                number,
            ];
        }) {
            return n._range;
        },
        *forEachProperty() {/* no children */},
    };
    
    const path = getFocusPath(node, 10, parser);
    
    t.equal(path.length, 0);
    t.end();
});

test('nodeToRange: falls back to first/last child range when parent has no range', (t) => {
    const child1 = {
        _range: [0, 5],
        length: 0,
    };
    
    const child2 = {
        _range: [10, 20],
        length: 0,
    };
    
    // parent is array-like
    const parent = [child1, child2] as ArrayLikeNode;
    
    parent.length = 2;
    
    if (!parent.at)
        parent.at = function(i) {
            return i < 0 ? this[this.length + i] : this[i];
        };
    
    const parser = {
        nodeToRange(n: {
            _range?: [
                number,
                number,
            ];
        }) {
            return n._range;
        },
        *forEachProperty() {},
    };
    
    const result = nodeToRange(parser, parent);
    const expected = [0, 20];
    
    t.deepEqual(result, expected);
    t.end();
});

test('getFocusPath: prepends parent when parent has no range but child does', (t) => {
    const child = {
        _range: [10, 20],
        length: 0,
    };
    
    // make parent array-like and also expose child property for parser.forEachProperty
    const parent = [child] as ArrayLikeNode;
    
    parent.child = child;
    parent.length = 1;
    
    if (!parent.at)
        parent.at = function(i) {
            return i < 0 ? this[this.length + i] : this[i];
        };
    
    const parser = {
        nodeToRange(n: {
            _range?: [
                number,
                number,
            ];
        }) {
            return n._range;
        },
        *forEachProperty(node: {
            child?: unknown;
            children?: Iterable<unknown>;
            [key: string]: unknown;
        }) {
            if (node.child)
                yield {
                    value: node.child,
                };
        },
    };
    
    const path = getFocusPath(parent, 15, parser);
    
    t.equal(path[0], parent);
    t.end();
});

test('getFocusPath: handles cycles without infinite recursion', (t) => {
    const a: {
        length: number;
        child?: unknown;
        _range?: [
            number,
            number,
        ];
    } = {
        length: 1,
    };
    
    const b: {
        length: number;
        child?: unknown;
        _range?: [
            number,
            number,
        ];
    } = {
        length: 1,
    };
    
    a.child = b;
    b.child = a;
    
    // cycle
    a._range = [0, 100];
    b._range = [10, 20];
    
    const parser = {
        nodeToRange(n: {
            _range?: [
                number,
                number,
            ];
        }) {
            return n._range;
        },
        *forEachProperty(node: {
            child?: unknown;
            children?: Iterable<unknown>;
            [key: string]: unknown;
        }) {
            if (node.child)
                yield {
                    value: node.child,
                };
        },
    };
    
    const path = getFocusPath(a, 15, parser);
    
    t.equal(path.length, 2);
    t.end();
});

test('getFocusPath: parent combined range out of pos returns empty', (t) => {
    const child1 = {
        _range: [0, 5],
        length: 0,
    };
    
    const child2 = {
        _range: [10, 20],
        length: 0,
    };
    
    const parent = [child1, child2] as ArrayLikeNode;
    
    parent.length = 2;
    
    if (!parent.at)
        parent.at = function(i) {
            return i < 0 ? this[this.length + i] : this[i];
        };
    
    const parser = {
        nodeToRange(n: {
            _range?: [
                number,
                number,
            ];
        }) {
            return n._range;
        },
        *forEachProperty(node: unknown) {
            const list = node as unknown[];
            
            if (list[0])
                for (const v of list)
                    yield {
                        value: v,
                    };
        },
    };
    
    const path = getFocusPath(parent, 25, parser);
    
    t.equal(path.length, 0);
    t.end();
});

test('getFocusPath: ignores non-object or falsy property values', (t) => {
    const child = {
        _range: [10, 20],
        length: 0,
    };
    
    const parent = [child] as ArrayLikeNode;
    
    parent.child = child;
    parent.numberProp = 5;
    parent.nullProp = null;
    parent.length = 1;
    
    if (!parent.at)
        parent.at = function(i) {
            return i < 0 ? this[this.length + i] : this[i];
        };
    
    const parser = {
        nodeToRange(n: {
            _range?: [
                number,
                number,
            ];
        }) {
            return n._range;
        },
        *forEachProperty(node: {
            child?: unknown;
            children?: Iterable<unknown>;
            [key: string]: unknown;
        }) {
            if (node.child)
                yield {
                    value: node.child,
                };
            
            if (node.numberProp)
                yield {
                    value: node.numberProp,
                };
            
            if ('nullProp' in node)
                yield {
                    value: node.nullProp,
                };
        },
    };
    
    const path = getFocusPath(parent, 15, parser);
    const result = path.at(-1);
    const expected = child;
    
    t.equal(result, expected);
    t.end();
});

test('getFocusPath: prepends parent when parent has no range or length but child does: path length', (t) => {
    const child = {
        _range: [10, 20],
        length: 0,
    };
    
    const parent = {
        child,
    };
    
    const parser = {
        nodeToRange(n: {
            _range?: [
                number,
                number,
            ];
        }) {
            return n._range;
        },
        *forEachProperty(node: {
            child?: unknown;
            children?: Iterable<unknown>;
            [key: string]: unknown;
        }) {
            if (node.child)
                yield {
                    value: node.child,
                };
        },
    };
    
    const path = getFocusPath(parent, 15, parser);
    
    t.equal(path.length, 2);
    t.end();
});

test('getFocusPath: prepends parent when parent has no range or length but child does: first item is parent', (t) => {
    const child = {
        _range: [10, 20],
        length: 0,
    };
    
    const parent = {
        child,
    };
    
    const parser = {
        nodeToRange(n: {
            _range?: [
                number,
                number,
            ];
        }) {
            return n._range;
        },
        *forEachProperty(node: {
            child?: unknown;
            children?: Iterable<unknown>;
            [key: string]: unknown;
        }) {
            if (node.child)
                yield {
                    value: node.child,
                };
        },
    };
    
    const path = getFocusPath(parent, 15, parser);
    
    t.equal(path[0], parent);
    t.end();
});

test('getFocusPath: nodeToRange returns undefined for NaN start from parser', (t) => {
    const parser = {
        nodeToRange() {
            return [NaN, 5];
        },
        *forEachProperty() {},
    };
    
    const result = nodeToRange(parser, {});
    
    t.notOk(result);
    t.end();
});

test('getFocusPath: nodeToRange returns undefined for Infinity end from parser', (t) => {
    const parser = {
        nodeToRange() {
            return [0, Infinity];
        },
        *forEachProperty() {},
    };
    
    const result = nodeToRange(parser, {});
    
    t.notOk(result);
    t.end();
});

test('getFocusPath: nodeToRange returns undefined for negative offset from parser', (t) => {
    const parser = {
        nodeToRange() {
            return [-5, 5];
        },
        *forEachProperty() {},
    };
    
    const result = nodeToRange(parser, {});
    
    t.notOk(result);
    t.end();
});
