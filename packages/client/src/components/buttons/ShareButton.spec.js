import {test, stub} from 'supertape';
import {
    render,
    screen,
    fireEvent,
    cleanup,
} from '@testing-library/react';
import ShareButton from './ShareButton.js';

test('ShareButton: no snippet: disabled', (t) => {
    render(
        <ShareButton onShareButtonClick={stub()} snippet={null}/>,
    );
    
    const {disabled} = screen.getByRole('button');
    
    cleanup();
    
    t.ok(disabled);
    t.end();
});

test('ShareButton: snippet present: enabled', (t) => {
    render(
        <ShareButton onShareButtonClick={stub()} snippet={{}}/>,
    );
    
    const {disabled} = screen.getByRole('button');
    
    cleanup();
    
    t.notOk(disabled);
    t.end();
});

test('ShareButton: click: calls onShareButtonClick', (t) => {
    const onShareButtonClick = stub();
    
    render(
        <ShareButton onShareButtonClick={onShareButtonClick} snippet={{}}/>,
    );
    fireEvent.click(screen.getByRole('button'));
    
    cleanup();
    
    t.calledOnce(onShareButtonClick);
    t.end();
});
