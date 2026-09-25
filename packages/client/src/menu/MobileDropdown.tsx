import {
    useState,
    useEffect,
    useRef,
    type ReactNode,
} from 'react';

const isUndefined = (a: unknown): a is undefined => typeof a === 'undefined';

type Props = {
    trigger: ReactNode;
    children: ReactNode;
    className?: string;
    open?: boolean;
    onToggle?: () => void;
};

export default function MobileDropdown({trigger, children, className, open: openProp, onToggle}: Props) {
    const [openInternal, setOpenInternal] = useState(false);
    const isControlled = !isUndefined(openProp);
    const open = isControlled ? openProp : openInternal;
    const ref = useRef<HTMLDivElement>(null);
    
    const toggle = () => {
        if (isControlled) {
            onToggle?.();
            return;
        }
        
        setOpenInternal((v) => !v);
    };
    
    const close = () => {
        if (isControlled) {
            onToggle?.();
            return;
        }
        
        setOpenInternal(false);
    };
    
    useEffect(() => {
        if (!open)
            return;
        
        const onOutsideClick = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node))
                close();
        };
        
        document.addEventListener('click', onOutsideClick);
        
        return () => document.removeEventListener('click', onOutsideClick);
    }, [open]);
    
    const classes = ['mobile-dropdown', className]
        .filter(Boolean)
        .join(' ');
    
    return (
        <div ref={ref} className={classes}>
            <button
                type="button"
                className="mobile-dropdown__trigger"
                aria-expanded={open}
                aria-haspopup="menu"
                onPointerUp={(e) => {
                    e.currentTarget.focus();
                    toggle();
                }}
            >
                {trigger}
            </button>
            {open && (
                <ul
                    role="menu"
                    className="mobile-dropdown__menu"
                    onClick={() => close()}
                >
                    {children}
                </ul>
            )}
        </div>
    );
}
