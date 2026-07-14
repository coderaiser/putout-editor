import {test} from 'supertape';
import getFocusPath from './getFocusPath.js';

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
        nodeToRange(node) {
            return node._range;
        },
        *forEachProperty(node) {
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
        nodeToRange(node) {
            return node._range;
        },
        *forEachProperty(node) {
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
        nodeToRange(node) {
            return node._range;
        },
        *forEachProperty(node) {
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
        nodeToRange(node) {
            return node._range;
        },
        *forEachProperty(node) {
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
        nodeToRange(n) {
            return n._range;
        },
        *forEachProperty() {/* no children */},
    };
    
    const path = getFocusPath(node, 10, parser);
    
    t.equal(path.length, 0);
    t.end();
});
