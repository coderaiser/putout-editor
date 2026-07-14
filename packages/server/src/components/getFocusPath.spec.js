import {test} from 'supertape';
import getFocusPath, {nodeToRange} from '../../../client/src/components/getFocusPath.js';

test('server: nodeToRange fallback combined range', (t) => {
    const child1 = {
        _range: [0, 5],
        length: 0,
    };
    
    const child2 = {
        _range: [10, 20],
        length: 0,
    };
    
    const parent = [child1, child2];
    
    parent.length = 2;
    
    if (!parent.at)
        parent.at = function(i) {
            return i < 0 ? this[this.length + i] : this[i];
        };
    
    const parser = {
        nodeToRange(n) {
            return n._range;
        },
    };
    
    const range = nodeToRange(parser, parent);
    
    t.deepEqual(range, [0, 20]);
    t.end();
});

test('server: getFocusPath parent prepend when no parent range', (t) => {
    const child = {
        _range: [10, 20],
        length: 0,
    };
    
    const parent = [child];
    
    parent.child = child;
    parent.length = 1;
    
    if (!parent.at)
        parent.at = function(i) {
            return i < 0 ? this[this.length + i] : this[i];
        };
    
    const parser = {
        nodeToRange(n) {
            return n._range;
        },
        *forEachProperty(node) {
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

test('server: single node with range returns node', (t) => {
    const node = {
        _range: [0, 100],
    };
    
    const parser = {
        nodeToRange(n) {
            return n._range;
        },
        *forEachProperty() {},
    };
    
    const path = getFocusPath(node, 10, parser);
    
    t.equal(path[0], node);
    t.end();
});
