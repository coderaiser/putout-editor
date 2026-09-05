import {
    useState,
    useEffect,
    useRef,
} from 'react';

export default function MobileDropdown({trigger, children, className}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    
    useEffect(() => {
        if (!open)
            return;
        
        function onPointerDown(e) {
            if (!ref.current?.contains(e.target))
                setOpen(false);
        }
        
        document.addEventListener('pointerdown', onPointerDown);
        
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open]);
    
    return (
        <div
            className={'mobile-dropdown' + (className ? ` ${className}` : '')}
            ref={ref}
        >
            <button
                type="button"
                className="mobile-dropdown-trigger"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                {trigger}
            </button>
            {open && (
                <ul
                    className="mobile-dropdown-menu"
                    role="menu"
                    onClick={() => setOpen(false)}
                >
                    {children}
                </ul>
            )}
        </div>
    );
}
