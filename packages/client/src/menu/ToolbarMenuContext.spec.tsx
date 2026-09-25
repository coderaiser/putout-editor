import {test} from 'supertape';
import {
    act,
    cleanup,
    render,
} from '@testing-library/react';
import {
    ToolbarMenuProvider,
    useToolbarMenu,
} from './ToolbarMenuContext.tsx';

const Capture = ({capture}: {capture: (value: ReturnType<typeof useToolbarMenu>) => void;}) => {
    capture(useToolbarMenu());
    return null;
};

test('ToolbarMenuContext: openId is null initially', (t) => {
    let value: ReturnType<typeof useToolbarMenu>;
    
    render(
        <ToolbarMenuProvider>
            <Capture
                capture={(next) => {
                    value = next;
                }}
            />
        </ToolbarMenuProvider>,
    );
    t.equal(value!.openId, null);
    cleanup();
    t.end();
});

test('ToolbarMenuContext: toggle sets openId', (t) => {
    let value: ReturnType<typeof useToolbarMenu>;
    
    render(
        <ToolbarMenuProvider>
            <Capture
                capture={(next) => {
                    value = next;
                }}
            />
        </ToolbarMenuProvider>,
    );
    act(() => value!.toggle('foo'));
    t.equal(value!.openId, 'foo');
    cleanup();
    t.end();
});

test('ToolbarMenuContext: toggle same id closes', (t) => {
    let value: ReturnType<typeof useToolbarMenu>;
    
    render(
        <ToolbarMenuProvider>
            <Capture
                capture={(next) => {
                    value = next;
                }}
            />
        </ToolbarMenuProvider>,
    );
    act(() => value!.toggle('foo'));
    act(() => value!.toggle('foo'));
    t.equal(value!.openId, null);
    cleanup();
    t.end();
});

test('ToolbarMenuContext: toggle different id replaces', (t) => {
    let value: ReturnType<typeof useToolbarMenu>;
    
    render(
        <ToolbarMenuProvider>
            <Capture
                capture={(next) => {
                    value = next;
                }}
            />
        </ToolbarMenuProvider>,
    );
    act(() => value!.toggle('foo'));
    act(() => value!.toggle('bar'));
    t.equal(value!.openId, 'bar');
    cleanup();
    t.end();
});

test('ToolbarMenuContext: toggle new id closes', (t) => {
    let value: ReturnType<typeof useToolbarMenu>;
    
    render(
        <ToolbarMenuProvider>
            <Capture
                capture={(next) => {
                    value = next;
                }}
            />
        </ToolbarMenuProvider>,
    );
    act(() => value!.toggle('new'));
    act(() => value!.toggle('new'));
    t.equal(value!.openId, null);
    cleanup();
    t.end();
});

test('ToolbarMenuContext: toggle submenu opens with parent', (t) => {
    let value: ReturnType<typeof useToolbarMenu>;
    
    render(
        <ToolbarMenuProvider>
            <Capture
                capture={(next) => {
                    value = next;
                }}
            />
        </ToolbarMenuProvider>,
    );
    act(() => value!.toggle('snippet'));
    act(() => value!.toggle('new', 'snippet'));
    t.equal(value!.openId, 'new');
    cleanup();
    t.end();
});

test('ToolbarMenuContext: closing submenu falls back to parent', (t) => {
    let value: ReturnType<typeof useToolbarMenu>;
    
    render(
        <ToolbarMenuProvider>
            <Capture
                capture={(next) => {
                    value = next;
                }}
            />
        </ToolbarMenuProvider>,
    );
    act(() => value!.toggle('snippet'));
    act(() => value!.toggle('new', 'snippet'));
    act(() => value!.toggle('new', 'snippet'));
    t.equal(value!.openId, 'snippet');
    cleanup();
    t.end();
});

test('ToolbarMenuContext: fallback parent closes on its own toggle', (t) => {
    let value: ReturnType<typeof useToolbarMenu>;
    
    render(
        <ToolbarMenuProvider>
            <Capture
                capture={(next) => {
                    value = next;
                }}
            />
        </ToolbarMenuProvider>,
    );
    act(() => value!.toggle('snippet'));
    act(() => value!.toggle('new', 'snippet'));
    act(() => value!.toggle('new', 'snippet'));
    act(() => value!.toggle('snippet'));
    t.equal(value!.openId, null);
    cleanup();
    t.end();
});

test('ToolbarMenuContext: close drops parent fallback', (t) => {
    let value: ReturnType<typeof useToolbarMenu>;
    
    render(
        <ToolbarMenuProvider>
            <Capture
                capture={(next) => {
                    value = next;
                }}
            />
        </ToolbarMenuProvider>,
    );
    act(() => value!.toggle('snippet'));
    act(() => value!.toggle('new', 'snippet'));
    act(() => value!.close());
    act(() => value!.toggle('new', 'snippet'));
    act(() => value!.toggle('new', 'snippet'));
    t.equal(value!.openId, 'snippet');
    cleanup();
    t.end();
});

test('ToolbarMenuContext: close sets openId to null', (t) => {
    let value: ReturnType<typeof useToolbarMenu>;
    
    render(
        <ToolbarMenuProvider>
            <Capture
                capture={(next) => {
                    value = next;
                }}
            />
        </ToolbarMenuProvider>,
    );
    act(() => value!.toggle('foo'));
    act(() => value!.close());
    t.equal(value!.openId, null);
    cleanup();
    t.end();
});

test('ToolbarMenuContext: default callbacks are noops', (t) => {
    let value: ReturnType<typeof useToolbarMenu>;
    
    render(
        <Capture
            capture={(next) => {
                value = next;
            }}
        />,
    );
    act(() => value!.toggle('foo'));
    act(() => value!.close());
    t.equal(value!.openId, null);
    cleanup();
    t.end();
});
