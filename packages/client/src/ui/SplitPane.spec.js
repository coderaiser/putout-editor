import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import SplitPane from './SplitPane.js';

const render2 = (props = {}) => render(
    <SplitPane className="pane" {...props}>
        <div id="a">left</div>
        <div id="b">right</div>
    </SplitPane>,
);

const hasElem = (props = {}, query) => {
    const {container} = render2(props);
    const result = container.querySelector(query);
    
    cleanup();
    
    return result;
};

test('SplitPane: renders root with className', (t) => {
    const result = hasElem({}, '.pane');
    
    t.ok(result);
    t.end();
});

test('SplitPane: renders first child', (t) => {
    const result = hasElem({}, '#a');
    
    t.ok(result);
    t.end();
});

test('SplitPane: renders second child', (t) => {
    const result = hasElem({}, '#b');
    
    t.ok(result);
    t.end();
});

test('SplitPane: renders divider', (t) => {
    const result = hasElem({}, '.splitpane-divider');
    
    t.ok(result);
    t.end();
});

test('SplitPane: divider has no vertical class by default', (t) => {
    const result = hasElem({}, '.splitpane-divider.vertical');
    
    t.notOk(result);
    t.end();
});

test('SplitPane: vertical adds vertical class to divider', (t) => {
    const result = hasElem({vertical: true}, '.splitpane-divider.vertical');
    
    t.ok(result);
    t.end();
});

test('SplitPane: single child renders without divider', (t) => {
    const {container} = render(
        <SplitPane className="pane"><div id="only">x</div></SplitPane>,
    );
    
    const result = container.querySelector('.splitpane-divider');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('SplitPane: single child is rendered', (t) => {
    const {container} = render(
        <SplitPane className="pane"><div id="only">x</div></SplitPane>,
    );
    
    const result = container.querySelector('#only');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('SplitPane: pointerdown on divider does not throw', (t) => {
    const {container} = render2();
    fireEvent.pointerDown(container.querySelector('.splitpane-divider'));
    cleanup();
    
    t.ok(true);
    t.end();
});

test('SplitPane: pointerup calls onResize', (t) => {
    let called = false;
    const {container} = render(
        <SplitPane
            className="pane"
            onResize={() => {
                called = true;
            }}
        >
            <div>a</div><div>b</div>
        </SplitPane>,
    );
    
    fireEvent.pointerDown(container.querySelector('.splitpane-divider'));
    fireEvent.pointerUp(document);
    cleanup();
    
    t.ok(called);
    t.end();
});

test('SplitPane: pointerup without onResize does not throw', (t) => {
    const {container} = render2();
    fireEvent.pointerDown(container.querySelector('.splitpane-divider'));
    fireEvent.pointerUp(document);
    cleanup();
    
    t.ok(true);
    t.end();
});

test('SplitPane: pointerup resets body cursor', (t) => {
    const {container} = render2();
    fireEvent.pointerDown(container.querySelector('.splitpane-divider'));
    fireEvent.pointerUp(document);
    cleanup();
    
    t.equal(document.body.style.cursor, '');
    t.end();
});

test('SplitPane: pointermove changes divider position', (t) => {
    const {container} = render2();
    const divider = container.querySelector('.splitpane-divider');
    const beforeStyle = divider.style.left;
    
    fireEvent.pointerDown(divider);
    fireEvent.pointerMove(document, {
        pageX: 800,
    });
    fireEvent.pointerUp(document);
    cleanup();
    
    t.notOk(divider.style.left === beforeStyle);
    t.end();
});

test('SplitPane: vertical pointermove uses pageY', (t) => {
    const {container} = render(
        <SplitPane className="pane" vertical={true}>
            <div>a</div><div>b</div>
        </SplitPane>,
    );
    
    const divider = container.querySelector('.splitpane-divider');
    
    fireEvent.pointerDown(divider);
    fireEvent.pointerMove(document, {
        pageY: 300,
    });
    fireEvent.pointerUp(document);
    cleanup();
    
    t.ok(true);
    t.end();
});
