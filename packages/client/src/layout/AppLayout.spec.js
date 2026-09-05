import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import AppLayout from '#layout';

test('AppLayout: renders topLeft content', (t) => {
    const {container} = render(
        <AppLayout
            topLeft={<div id="tl">TL</div>}
            topRight={<div/>}
            bottomLeft={<div/>}
            bottomRight={<div/>}
        />,
    );
    
    const result = container.querySelector('#tl');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('AppLayout: renders topRight content', (t) => {
    const {container} = render(
        <AppLayout
            topLeft={<div/>}
            topRight={<div id="tr">TR</div>}
            bottomLeft={<div/>}
            bottomRight={<div/>}
        />,
    );
    
    const result = container.querySelector('#tr');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('AppLayout: renders bottomLeft content', (t) => {
    const {container} = render(
        <AppLayout
            topLeft={<div/>}
            topRight={<div/>}
            bottomLeft={<div id="bl">BL</div>}
            bottomRight={<div/>}
        />,
    );
    
    const result = container.querySelector('#bl');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('AppLayout: renders bottomRight content', (t) => {
    const {container} = render(
        <AppLayout
            topLeft={<div/>}
            topRight={<div/>}
            bottomLeft={<div/>}
            bottomRight={<div id="br">BR</div>}
        />,
    );
    
    const result = container.querySelector('#br');
    
    cleanup();
    
    t.ok(result);
    t.end();
});
