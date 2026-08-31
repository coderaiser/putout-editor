import {test, stub} from 'supertape';
import {
    render,
    fireEvent,
    cleanup,
} from '@testing-library/react';
import ShareDialog from './ShareDialog.js';

const snippet = {
    getShareData: stub().returns({
        versionedURL: '#/gist/abc',
        latestURL: '#/gist/abc/latest',
        embedURL: '<script src="x.js"></script>',
    }),
};

test('ShareDialog: not visible: renders nothing', (t) => {
    const onWantToClose = stub();
    
    render(
        <ShareDialog visible={false} snippet={snippet} onWantToClose={onWantToClose}/>,
    );
    
    const result = document.getElementById('ShareDialog');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('ShareDialog: visible: renders dialog', (t) => {
    const onWantToClose = stub();
    
    render(
        <ShareDialog visible={true} snippet={snippet} onWantToClose={onWantToClose}/>,
    );
    
    const dialog = document.getElementById('ShareDialog');
    
    cleanup();
    
    t.ok(dialog);
    t.end();
});

test('ShareDialog: visible: renders share data from snippet', (t) => {
    const onWantToClose = stub();
    
    render(
        <ShareDialog visible={true} snippet={snippet} onWantToClose={onWantToClose}/>,
    );
    
    const input = document.querySelector('.body input');
    
    cleanup();
    
    t.equal(input.value, '#/gist/abc');
    t.end();
});

test('ShareDialog: focus on input selects value', (t) => {
    const onWantToClose = stub();
    
    render(
        <ShareDialog visible={true} snippet={snippet} onWantToClose={onWantToClose}/>,
    );
    
    const inputs = document.querySelectorAll('.body input');
    
    inputs.forEach(fireEvent.focus);
    
    const selected = Array
        .from(inputs)
        .every((input) => input.value === '#/gist/abc' || input.value === '#/gist/abc/latest' || input.value.startsWith('<script'));
    
    cleanup();
    
    t.ok(selected);
    t.end();
});

test('ShareDialog: click on outer dialog: closes', (t) => {
    const onWantToClose = stub();
    
    render(
        <ShareDialog visible={true} snippet={snippet} onWantToClose={onWantToClose}/>,
    );
    
    const dialog = document.getElementById('ShareDialog');
    fireEvent.click(dialog);
    
    cleanup();
    
    t.calledOnce(onWantToClose);
    t.end();
});

test('ShareDialog: click on inner dialog: does not close', (t) => {
    const onWantToClose = stub();
    
    render(
        <ShareDialog visible={true} snippet={snippet} onWantToClose={onWantToClose}/>,
    );
    
    const inner = document.querySelector('.inner');
    fireEvent.click(inner);
    
    cleanup();
    
    t.notCalled(onWantToClose);
    t.end();
});
