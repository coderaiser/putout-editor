import React from 'react';
import {test, stub} from 'supertape';
import {render, screen, fireEvent, cleanup} from '@testing-library/react';
import ShareButton from './ShareButton.js';

test('ShareButton: no snippet: disabled', (t) => {
    render(<ShareButton onShareButtonClick={stub()} snippet={null}/>);
    
    t.ok(screen.getByRole('button').disabled);
    
    cleanup();
    t.end();
});

test('ShareButton: snippet present: enabled', (t) => {
    render(<ShareButton onShareButtonClick={stub()} snippet={{}}/>);
    
    t.notOk(screen.getByRole('button').disabled);
    
    cleanup();
    t.end();
});

test('ShareButton: click: calls onShareButtonClick', (t) => {
    const onShareButtonClick = stub();
    
    render(<ShareButton onShareButtonClick={onShareButtonClick} snippet={{}}/>);
    fireEvent.click(screen.getByRole('button'));
    
    t.equal(onShareButtonClick.callCount, 1);
    
    cleanup();
    t.end();
});
