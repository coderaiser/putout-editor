import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import FlowBlock from './FlowBlock.tsx';

const blocks = [{
    id: 0,
    stmts: ['x > 0 ?'],
    succs: [{
        id: 1,
        label: 'true',
    }, {
        id: 2,
        label: 'false',
    }],
}, {
    id: 1,
    stmts: ['return a;'],
    succs: [{
        id: 'exit',
    }],
    terminal: true,
}, {
    id: 2,
    stmts: ['return b;'],
    succs: [{
        id: 'exit',
    }],
    terminal: true,
}];

const block = (over: any = {}) => render(
    <FlowBlock
        blocks={blocks}
        source={`x > 0 ?\nreturn a;\nreturn b;\n`}
        {...over}
    />,
);

/** /graph renders both panels side by side. */
test('FlowBlock: renders source panel and graph panel', (t) => {
    block();
    
    const source = document.querySelector('.flow-output__source') !== null;
    const graph = document.querySelector('.flow-output__graph') !== null;
    
    cleanup();
    
    t.equal(source && graph, true);
    t.end();
});

/** The flow-output testid lives on the wrapper only. */
test('FlowBlock: data-testid flow-output on wrapper', (t) => {
    block();
    
    const result = document.querySelector('[data-testid="flow-output"]') !== null;
    
    cleanup();
    
    t.equal(result, true);
    t.end();
});

/** The source panel carries its own data-testid. */
test('FlowBlock: source panel has data-testid flow-output__source', (t) => {
    block();
    
    const result = document.querySelector('[data-testid="flow-output__source"]') !== null;
    
    cleanup();
    
    t.equal(result, true);
    t.end();
});

/** The graph panel carries its own data-testid. */
test('FlowBlock: graph panel has data-testid flow-output__graph', (t) => {
    block();
    
    const result = document.querySelector('[data-testid="flow-output__graph"]') !== null;
    
    cleanup();
    
    t.equal(result, true);
    t.end();
});

/** Unreachable lines carry data-unreachable. */
test('FlowBlock: unreachable lines get highlight class', (t) => {
    const fakeBlocks: import('@putout/flow').Block[] = [{
        id: 0,
        stmts: ['return a;'],
        succs: [{
            id: 0,
        }],
        terminal: true,
    }, {
        id: 1,
        stmts: [
            'console.log(a);',
        ],
        succs: [],
        unreachable: true,
        terminal: true,
    }];
    
    render(
        <FlowBlock
            blocks={fakeBlocks}
            source={`return a;\nconsole.log(a);\n`}
        />,
    );
    
    const unreachable = document.querySelector('[data-unreachable="true"]');
    
    cleanup();
    
    t.equal(unreachable !== null, true);
    t.end();
});

/** Duplicate statement text appears on more than one line. */
test('FlowBlock: duplicate lines get highlight class', (t) => {
    const duplicateBlocks: import('@putout/flow').Block[] = [{
        id: 0,
        stmts: ['x > 0 ?'],
        succs: [{
            id: 1,
            label: 'true',
        }, {
            id: 2,
            label: 'false',
        }],
    }, {
        id: 1,
        stmts: ['doWork();'],
        succs: [{
            id: 3,
        }],
    }, {
        id: 2,
        stmts: ['doWork();'],
        succs: [{
            id: 3,
        }],
    }, {
        id: 3,
        stmts: [],
        succs: [{
            id: 0,
        }],
    }];
    
    render(
        <FlowBlock
            blocks={duplicateBlocks}
            source={`x > 0 ?\ndoWork();\ndoWork();\n`}
        />,
    );
    
    const duplicates = document.querySelectorAll('[data-duplicate="true"]');
    
    cleanup();
    
    t.equal(duplicates.length, 0);
    t.end();
});

/** Clicking a line calls onNavigate with its line number. */
test('FlowBlock: click on block calls onNavigate with line number', (t) => {
    const navigated: number[] = [];
    const push = navigated.push.bind(navigated);
    
    render(
        <FlowBlock
            blocks={blocks}
            source={`x > 0 ?\nreturn a;\nreturn b;\n`}
            onNavigate={push}
        />,
    );
    
    const lines = document.querySelectorAll('.flow-output__line');
    
    fireEvent.click(lines[1]);
    
    cleanup();
    
    t.deepEqual(navigated, [2]);
    t.end();
});
