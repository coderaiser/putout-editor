import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from 'react';

const noop = () => {};

export type ToolbarMenuContextValue = {
    openId: string | null;
    toggle: (id: string) => void;
    close: () => void;
};

export const ToolbarMenuContext = createContext<ToolbarMenuContextValue>({
    openId: null,
    toggle: noop,
    close: noop,
});

export const useToolbarMenu = () => useContext(ToolbarMenuContext);

export function ToolbarMenuProvider({children}: {children: ReactNode;}) {
    const [openId, setOpenId] = useState<string | null>(null);
    const toggle = useCallback((id: string) => {
        setOpenId((current) => current === id ? null : id);
    }, []);
    
    const close = useCallback(() => {
        setOpenId(null);
    }, []);
    
    return (
        <ToolbarMenuContext.Provider
            value={{
                openId,
                toggle,
                close,
            }}
        >
            {children}
        </ToolbarMenuContext.Provider>
    );
}
