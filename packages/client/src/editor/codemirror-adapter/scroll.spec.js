import {test} from 'supertape';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {getScrollInfo, scrollTo} from './scroll.js';

function makeView() {
    const element = document.createElement('div');
    document.body.appendChild(element);
    return new EditorView({state: EditorState.create({doc: 'hello'}), parent: element});
}

test('scroll: getScrollInfo left is a number', (t) => {
    const view = makeView();
    t.equal(typeof getScrollInfo(view).left, 'number');
    view.destroy();
    t.end();
});

test('scroll: getScrollInfo top is a number', (t) => {
    const view = makeView();
    t.equal(typeof getScrollInfo(view).top, 'number');
    view.destroy();
    t.end();
});

test('scroll: scrollTo sets scrollLeft to 0', (t) => {
    const view = makeView();
    scrollTo(view, 0, 0);
    t.equal(view.scrollDOM.scrollLeft, 0);
    view.destroy();
    t.end();
});

test('scroll: scrollTo sets scrollTop to 0', (t) => {
    const view = makeView();
    scrollTo(view, 0, 0);
    t.equal(view.scrollDOM.scrollTop, 0);
    view.destroy();
    t.end();
});