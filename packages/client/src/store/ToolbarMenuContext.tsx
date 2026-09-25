import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from 'react';

const noop = () => {};

type MenuState = {
    id: string | null;
    parent: string | null;
};

const closed: MenuState = {
    id: null,
    parent: null,
};

export type ToolbarMenuContextValue = {
    openId: string | null;
    toggle: (id: string, parentId?: string) => void;
    close: () => void;
};

export const ToolbarMenuContext = createContext<ToolbarMenuContextValue>({
    openId: null,
    toggle: noop,
    close: noop,
});

export const useToolbarMenu = () => useContext(ToolbarMenuContext);

export function ToolbarMenuProvider({children}: {children: ReactNode;}) {
    const [{
        id,
    }, setMenu] = useState<MenuState>(closed);
    
    const toggle = useCallback((menuId: string, parentId?: string) => {
        setMenu((current) => current.id === menuId ? {
            // closing a submenu falls back to the menu it was opened from,
            // so the parent menu stays open
            id: current.parent,
            parent: null,
        } : {
            id: menuId,
            parent: parentId ?? null,
        });
    }, []);
    
    const close = useCallback(() => {
        setMenu(closed);
    }, []);
    
    return (
        <ToolbarMenuContext.Provider
            value={{
                openId: id,
                toggle,
                close,
            }}
        >
            {children}
        </ToolbarMenuContext.Provider>
    );
}
