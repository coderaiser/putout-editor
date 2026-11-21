import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import TreeRow, {type TreeRowProps} from './TreeRow.tsx';

const noop = () => {};

const row = (over: Partial<TreeRowProps> = {}) => render(
    <TreeRow
        ancestorLastFlags={[]}
        collapsed={false}
        depth={0}
        dimmed={false}
        hasChildren={false}
        id="0"
        last={false}
        matched={false}
        onSelect={noop}
        onToggle={noop}
        selected={false}
        testId="row"
        {...over}
    >
        <span className="inside">
            {'inside'}
        </span>
    </TreeRow>,
);

const find = () => document.querySelector('[data-testid="row"]') as Element;

const classesOf = (element: Element) => {
    const result: string[] = [];
    
    for (const {className} of element.children)
        result.push(className);
    
    return result;
};

test('TreeRow: is a treeitem with the test id', (t) => {
    row();
    
    const result = find().getAttribute('role');
    
    cleanup();
    
    t.equal(result, 'treeitem');
    t.end();
});

test('TreeRow: carries the type as data-type', (t) => {
    row({
        type: 'Program',
    });
    
    const result = find().getAttribute('data-type');
    
    cleanup();
    
    t.equal(result, 'Program');
    t.end();
});

test('TreeRow: has no data-type without a type', (t) => {
    row();
    
    const result = find().hasAttribute('data-type');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('TreeRow: an ordinary row has only the base class', (t) => {
    row();
    
    const result = find().className;
    
    cleanup();
    
    t.equal(result, 'ast-row');
    t.end();
});

test('TreeRow: carries the selected class', (t) => {
    row({
        selected: true,
    });
    
    const result = find().classList.contains('ast-row--selected');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('TreeRow: carries the dimmed class', (t) => {
    row({
        dimmed: true,
    });
    
    const result = find().classList.contains('ast-row--dimmed');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('TreeRow: carries the match class', (t) => {
    row({
        matched: true,
    });
    
    const result = find().classList.contains('ast-row--match');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('TreeRow: draws connectors, then the caret, then the children', (t) => {
    row({
        ancestorLastFlags: [true, false],
        depth: 2,
        hasChildren: true,
        last: true,
    });
    
    const result = classesOf(find());
    
    cleanup();
    
    const expected = [
        'ast-row__connectors',
        'ast-row__caret',
        'inside',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('TreeRow: a click selects the id', (t) => {
    const selected: string[] = [];
    
    const onSelect = (id: string) => {
        selected.push(id);
    };
    
    row({
        id: '7',
        onSelect,
    });
    
    fireEvent.click(find());
    cleanup();
    
    const expected = ['7'];
    
    t.deepEqual(selected, expected);
    t.end();
});

test('TreeRow: a click folds a node with children', (t) => {
    const toggled: string[] = [];
    
    const onToggle = (id: string) => {
        toggled.push(id);
    };
    
    row({
        hasChildren: true,
        id: '7',
        onToggle,
    });
    
    fireEvent.click(find());
    cleanup();
    
    const expected = ['7'];
    
    t.deepEqual(toggled, expected);
    t.end();
});

test('TreeRow: a click leaves a leaf unfolded', (t) => {
    const toggled: string[] = [];
    
    const onToggle = (id: string) => {
        toggled.push(id);
    };
    
    row({
        onToggle,
    });
    
    fireEvent.click(find());
    cleanup();
    
    const expected: string[] = [];
    
    t.deepEqual(toggled, expected);
    t.end();
});
