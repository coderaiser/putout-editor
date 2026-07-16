import {test, stub} from 'supertape';
import {
    render,
    fireEvent,
    cleanup,
} from '@testing-library/react';
import ShareDialog from './ShareDialog.js';

const snippet = {
    getShareInfo: stub().returns('share info'),
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

test('ShareDialog: visible: renders share info from snippet', (t) => {
    const onWantToClose = stub();
    
    render(
        <ShareDialog visible={true} snippet={snippet} onWantToClose={onWantToClose}/>,
    );
    
    const body = document.querySelector('.body');
    
    cleanup();
    
    t.equal(body.textContent, 'share info');
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
