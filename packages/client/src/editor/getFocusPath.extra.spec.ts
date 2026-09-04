import {test} from 'supertape';
import getFocusPath from './getFocusPath.ts';

test('getFocusPath: single node with range returns node only (length)', (t) => {
    const node = {
        _range: [0, 100],
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
    
    t.equal(path.length, 1);
    t.end();
});

test('getFocusPath: single node with range returns node only (item)', (t) => {
    const node = {
        _range: [0, 100],
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
    
    t.equal(path[0], node);
    t.end();
});

test('getFocusPath: prepends parent when parent has no length and no range (parent)', (t) => {
    const child = {
        _range: [10, 20],
        length: 0,
    };
    
    // parent has no length property so nodeToRange fallback won't run
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

test('getFocusPath: prepends parent when parent has no length and no range (child)', (t) => {
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
            [key: string]: unknown;
        }) {
            if (node.child)
                yield {
                    value: node.child,
                };
        },
    };
    
    const path = getFocusPath(parent, 15, parser);
    const result = path.at(-1);
    const expected = child;
    
    t.equal(result, expected);
    t.end();
});
